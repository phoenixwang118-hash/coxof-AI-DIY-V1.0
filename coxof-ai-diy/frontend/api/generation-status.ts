import type { GenerationJob } from './_lib/contracts.js'
import { pollBflGeneration } from './_lib/bfl.js'
import {
  type ApiRequest,
  type ApiResponse,
  handleApiError,
  parseBody,
  requireMethod,
  requirePreviewAccess,
} from './_lib/http.js'
import { persistGeneratedAsset } from './_lib/supabase.js'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    requireMethod(req, 'POST')
    requirePreviewAccess(req)
    const job = parseBody<GenerationJob>(req)
    const result = await pollBflGeneration(job)

    if (result.status === 'Ready') {
      const persisted = await persistGeneratedAsset(result)
      res.status(200).json(persisted)
      return
    }
    res.status(200).json(result)
  } catch (error) {
    handleApiError(res, error)
  }
}
