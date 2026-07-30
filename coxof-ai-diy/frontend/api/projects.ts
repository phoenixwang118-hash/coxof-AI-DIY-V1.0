import type { ProjectInput } from './_lib/contracts.js'
import { createProject, getProjects } from './_lib/supabase.js'
import {
  type ApiRequest,
  type ApiResponse,
  handleApiError,
  HttpError,
  parseBody,
  requirePreviewAccess,
} from './_lib/http.js'

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    requirePreviewAccess(req)

    if (req.method === 'GET') {
      const workspaceId = queryValue(req.query.workspaceId)
      if (!workspaceId) {
        throw new HttpError(400, '缺少 workspaceId。', 'WORKSPACE_REQUIRED')
      }
      res.status(200).json({ projects: await getProjects(workspaceId) })
      return
    }

    if (req.method === 'POST') {
      const input = parseBody<ProjectInput>(req)
      if (!input.workspaceId || !input.name || !input.outputs?.length) {
        throw new HttpError(400, '项目资料不完整。', 'INVALID_PROJECT')
      }
      res.status(201).json({ project: await createProject(input) })
      return
    }

    throw new HttpError(405, '仅支持 GET 或 POST 请求。', 'METHOD_NOT_ALLOWED')
  } catch (error) {
    handleApiError(res, error)
  }
}
