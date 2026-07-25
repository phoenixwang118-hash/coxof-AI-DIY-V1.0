export type ApiRequest = {
  method?: string
  body?: unknown
  query: Record<string, string | string[] | undefined>
  headers: Record<string, string | string[] | undefined>
}

export type ApiResponse = {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string,
  ) {
    super(message)
  }
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function requireMethod(req: ApiRequest, method: 'GET' | 'POST') {
  if (req.method !== method) {
    throw new HttpError(405, `仅支持 ${method} 请求。`, 'METHOD_NOT_ALLOWED')
  }
}

export function requirePreviewAccess(req: ApiRequest) {
  const expected = process.env.COXOF_PREVIEW_TOKEN

  if (!expected && process.env.VERCEL) {
    throw new HttpError(
      503,
      '服务端尚未配置 COXOF_PREVIEW_TOKEN，真实生成已安全关闭。',
      'PREVIEW_TOKEN_NOT_CONFIGURED',
    )
  }

  if (expected && headerValue(req.headers['x-coxof-preview-token']) !== expected) {
    throw new HttpError(401, '请输入预览访问令牌后重试。', 'PREVIEW_ACCESS_REQUIRED')
  }
}

export function parseBody<T>(req: ApiRequest): T {
  if (!req.body || typeof req.body !== 'object') {
    throw new HttpError(400, '请求内容无效。', 'INVALID_BODY')
  }
  return req.body as T
}

export function handleApiError(res: ApiResponse, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, code: error.code })
    return
  }

  console.error(error)
  res.status(500).json({ error: '服务器暂时无法完成请求。', code: 'INTERNAL_ERROR' })
}
