export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiFailure {
  error: string
  details?: Record<string, string[] | undefined>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface MutationMessage {
  message: string
}
