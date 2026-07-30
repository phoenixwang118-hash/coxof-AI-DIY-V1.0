import type { GenerationJob, GenerationRequest, GenerationResult } from './contracts.js'
import { HttpError } from './http.js'

const BFL_ORIGIN = 'https://api.bfl.ai'
const BFL_MODEL = process.env.BFL_MODEL || 'flux-2-pro-preview'

type BflSubmitResponse = {
  id?: string
  polling_url?: string
  detail?: string
}

type BflStatusResponse = {
  status?: GenerationResult['status']
  result?: { sample?: string }
  error?: string
  detail?: string
}

function apiKey() {
  const key = process.env.BFL_API_KEY
  if (!key) {
    throw new HttpError(
      503,
      '服务端尚未配置 BFL_API_KEY，无法调用真实 FLUX 模型。',
      'BFL_NOT_CONFIGURED',
    )
  }
  return key
}

function validImageReference(value: string | undefined) {
  if (!value) return undefined
  if (value.startsWith('data:image/')) return value
  const url = new URL(value)
  if (url.protocol !== 'https:') {
    throw new HttpError(400, '参考图必须使用 HTTPS 地址。', 'INVALID_INPUT_IMAGE')
  }
  return value
}

export async function submitBflGeneration(input: GenerationRequest): Promise<GenerationJob> {
  const payload: Record<string, unknown> = {
    prompt: input.prompt,
    width: input.width,
    height: input.height,
    output_format: 'png',
  }

  if (input.mode === 'image') {
    payload.input_image = validImageReference(input.inputImage)
  }

  const response = await fetch(`${BFL_ORIGIN}/v1/${BFL_MODEL}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'x-key': apiKey(),
    },
    body: JSON.stringify(payload),
  })
  const body = (await response.json().catch(() => ({}))) as BflSubmitResponse

  if (!response.ok || !body.id || !body.polling_url) {
    if (response.status === 402) {
      throw new HttpError(402, 'BFL 点数不足，请充值后重试。', 'BFL_CREDITS_REQUIRED')
    }
    if (response.status === 429) {
      throw new HttpError(429, '生成任务过多，请稍后重试。', 'BFL_RATE_LIMITED')
    }
    throw new HttpError(
      502,
      body.detail || 'BFL 未接受生成任务。',
      'BFL_SUBMIT_FAILED',
    )
  }

  return { id: body.id, pollingUrl: body.polling_url, status: 'Pending' }
}

function assertBflPollingUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  const allowedHost =
    url.hostname === 'api.bfl.ai' ||
    url.hostname === 'api.eu.bfl.ai' ||
    url.hostname === 'api.us.bfl.ai'

  if (url.protocol !== 'https:' || !allowedHost) {
    throw new HttpError(400, '生成任务地址无效。', 'INVALID_POLLING_URL')
  }
  return url.toString()
}

export async function pollBflGeneration(job: GenerationJob): Promise<GenerationResult> {
  const response = await fetch(assertBflPollingUrl(job.pollingUrl), {
    headers: { accept: 'application/json', 'x-key': apiKey() },
  })
  const body = (await response.json().catch(() => ({}))) as BflStatusResponse

  if (!response.ok) {
    throw new HttpError(502, body.detail || '无法读取 BFL 生成状态。', 'BFL_POLL_FAILED')
  }

  if (body.status === 'Ready' && body.result?.sample) {
    return { id: job.id, status: 'Ready', imageUrl: body.result.sample, transient: true }
  }

  if (body.status === 'Error' || body.status === 'Failed') {
    return {
      id: job.id,
      status: body.status,
      error: body.error || body.detail || '生成失败。',
    }
  }

  return { id: job.id, status: 'Pending' }
}
