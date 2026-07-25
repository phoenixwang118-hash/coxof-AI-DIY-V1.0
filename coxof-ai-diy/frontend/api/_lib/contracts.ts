export type GenerationRequest = {
  prompt: string
  mode: 'text' | 'image'
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
  status: 'Pending'
}

export type GenerationResult = {
  id: string
  status: 'Pending' | 'Ready' | 'Error' | 'Failed'
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
  mode: 'text' | 'image'
  style: string
  outputs: GenerationResult[]
}
