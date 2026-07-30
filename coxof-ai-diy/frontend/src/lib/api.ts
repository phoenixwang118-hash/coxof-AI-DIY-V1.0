import type {
  GenerationJob,
  GenerationRequest,
  GenerationResult,
  Project,
  ProjectInput,
} from './contracts'

type ApiErrorBody = { error?: string; code?: string }

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
  }
}

function previewToken() {
  return window.sessionStorage.getItem('coxof_preview_token')
}

export function rememberPreviewToken(token: string) {
  window.sessionStorage.setItem('coxof_preview_token', token)
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = previewToken()
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-coxof-preview-token': token } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new ApiError(body.error || '请求失败，请稍后再试。', response.status, body.code)
  }

  return response.json() as Promise<T>
}

export async function submitGeneration(input: GenerationRequest) {
  return requestJson<{ jobs: GenerationJob[] }>('/api/generations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function checkGeneration(job: GenerationJob) {
  return requestJson<GenerationResult>('/api/generation-status', {
    method: 'POST',
    body: JSON.stringify(job),
  })
}

export async function waitForGeneration(
  jobs: GenerationJob[],
  onProgress: (results: GenerationResult[]) => void,
) {
  const completed = new Map<string, GenerationResult>()
  const deadline = Date.now() + 120_000

  while (completed.size < jobs.length && Date.now() < deadline) {
    const pending = jobs.filter((job) => !completed.has(job.id))
    const results = await Promise.all(pending.map(checkGeneration))

    for (const result of results) {
      if (['Ready', 'Error', 'Failed'].includes(result.status)) {
        completed.set(result.id, result)
      }
    }

    onProgress([...completed.values()])
    if (completed.size < jobs.length) {
      await new Promise((resolve) => window.setTimeout(resolve, 900))
    }
  }

  if (completed.size < jobs.length) {
    throw new ApiError('生成等待超时，可稍后从历史任务继续检查。', 408, 'GENERATION_TIMEOUT')
  }

  return jobs.map((job) => completed.get(job.id)!)
}

export async function saveProject(input: ProjectInput) {
  return requestJson<{ project: Project }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function listProjects(workspaceId: string) {
  const query = new URLSearchParams({ workspaceId })
  return requestJson<{ projects: Project[] }>(`/api/projects?${query}`)
}
