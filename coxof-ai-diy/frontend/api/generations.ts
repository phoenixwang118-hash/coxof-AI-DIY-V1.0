import type { GenerationRequest } from './_lib/contracts.js'
import { submitBflGeneration } from './_lib/bfl.js'
import {
  type ApiRequest,
  type ApiResponse,
  handleApiError,
  HttpError,
  parseBody,
  requireMethod,
  requirePreviewAccess,
} from './_lib/http.js'

function validate(input: GenerationRequest) {
  if (!input.prompt?.trim() || input.prompt.length > 2000) {
    throw new HttpError(400, '提示词长度必须为 1–2000 个字符。', 'INVALID_PROMPT')
  }
  if (!Number.isInteger(input.count) || input.count < 1 || input.count > 4) {
    throw new HttpError(400, '每次只能生成 1–4 张图。', 'INVALID_COUNT')
  }
  if (input.mode === 'image' && !input.inputImage) {
    throw new HttpError(400, '图生图必须提供参考图。', 'INPUT_IMAGE_REQUIRED')
  }
  if (input.width < 256 || input.height < 256 || input.width * input.height > 4_000_000) {
    throw new HttpError(400, '图片尺寸不符合模型限制。', 'INVALID_DIMENSIONS')
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    requireMethod(req, 'POST')
    requirePreviewAccess(req)
    const input = parseBody<GenerationRequest>(req)
    validate(input)

    const jobs = await Promise.all(
      Array.from({ length: input.count }, () => submitBflGeneration(input)),
    )
    res.status(202).json({ jobs })
  } catch (error) {
    handleApiError(res, error)
  }
}
