export type GenerationMode = 'text' | 'image'
export type GenerationStatus = 'Pending' | 'Ready' | 'Error' | 'Failed'

export type GenerationRequest = {
  prompt: string
  mode: GenerationMode
  inputImage?: string
  width: number
  height: number
  count: number
  productId: number
  productName: string
  style: string
}

export type GenerationJob = {
  id: string
  pollingUrl: string
  status: GenerationStatus
}

export type GenerationResult = {
  id: string
  status: GenerationStatus
  imageUrl?: string
  transient?: boolean
  error?: string
}

export type ProjectInput = {
  workspaceId: string
  name: string
  productId: number
  productName: string
  prompt: string
  mode: GenerationMode
  style: string
  outputs: GenerationResult[]
}

export type Project = ProjectInput & {
  id: string
  createdAt: string
  updatedAt: string
}
