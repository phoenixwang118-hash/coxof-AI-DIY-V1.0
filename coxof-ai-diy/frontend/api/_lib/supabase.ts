import type { GenerationResult, ProjectInput } from './contracts.js'
import { HttpError } from './http.js'

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new HttpError(
      503,
      '服务端尚未配置 Supabase，项目保存功能暂不可用。',
      'DATABASE_NOT_CONFIGURED',
    )
  }
  return { url, key }
}

function headers(extra?: Record<string, string>) {
  const { key } = config()
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export async function persistGeneratedAsset(result: GenerationResult) {
  if (result.status !== 'Ready' || !result.imageUrl) return result

  const { url } = config()
  const imageResponse = await fetch(result.imageUrl)
  if (!imageResponse.ok) {
    throw new HttpError(502, '生成图下载失败。', 'ASSET_DOWNLOAD_FAILED')
  }

  const contentType = imageResponse.headers.get('content-type') || 'image/png'
  const extension = contentType.includes('jpeg') ? 'jpg' : 'png'
  const objectPath = `generated/${result.id}.${extension}`
  const uploadResponse = await fetch(
    `${url}/storage/v1/object/generated-assets/${objectPath}`,
    {
      method: 'POST',
      headers: {
        ...headers(),
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: await imageResponse.arrayBuffer(),
    },
  )

  if (!uploadResponse.ok) {
    throw new HttpError(502, '生成图存储失败。', 'ASSET_UPLOAD_FAILED')
  }

  return {
    ...result,
    imageUrl: `${url}/storage/v1/object/public/generated-assets/${objectPath}`,
    transient: false,
  }
}

function projectRow(input: ProjectInput) {
  return {
    workspace_id: input.workspaceId,
    name: input.name,
    product_id: input.productId,
    product_name: input.productName,
    prompt: input.prompt,
    generation_mode: input.mode,
    style: input.style,
    outputs: input.outputs,
  }
}

function normalizeProject(row: Record<string, unknown>) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    productId: row.product_id,
    productName: row.product_name,
    prompt: row.prompt,
    mode: row.generation_mode,
    style: row.style,
    outputs: row.outputs,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createProject(input: ProjectInput) {
  const { url } = config()
  const response = await fetch(`${url}/rest/v1/projects`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(projectRow(input)),
  })
  const rows = (await response.json().catch(() => [])) as Record<string, unknown>[]

  if (!response.ok || !rows[0]) {
    throw new HttpError(502, '项目写入数据库失败。', 'PROJECT_SAVE_FAILED')
  }
  return normalizeProject(rows[0])
}

export async function getProjects(workspaceId: string) {
  const { url } = config()
  const query = new URLSearchParams({
    workspace_id: `eq.${workspaceId}`,
    select: '*',
    order: 'created_at.desc',
    limit: '50',
  })
  const response = await fetch(`${url}/rest/v1/projects?${query}`, {
    headers: headers(),
  })
  const rows = (await response.json().catch(() => [])) as Record<string, unknown>[]

  if (!response.ok) {
    throw new HttpError(502, '项目列表读取失败。', 'PROJECT_LIST_FAILED')
  }
  return rows.map(normalizeProject)
}
