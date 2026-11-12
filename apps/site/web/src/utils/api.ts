import axios, { type AxiosRequestConfig } from 'axios'
import { operatorSession } from '@awb/contracts'
import { axiosInstance } from '@/lib/axios'
import type { ApiFailure, ApiResponse } from '@/types/api'
import type { AuthResponse } from '@/types/auth'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: ApiFailure['details'],
  ) {
    super(message)
  }
}

export async function fetchApi<T>(path: string, options: AxiosRequestConfig = {}): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('API paths must be local')

  try {
    const response = await axiosInstance.request<ApiResponse<T>>({
      ...options,
      url: path,
    })

    if (response.status === 204) return undefined as T

    if (!response.data?.success || !('data' in response.data)) {
      throw new ApiError('Invalid server response', 502)
    }

    if (path === '/auth/login' || path === '/auth/me') {
      const data = response.data.data as AuthResponse

      data.user = operatorSession.parse(data.user)
    }

    return response.data.data
  } catch (error) {
    if (axios.isAxiosError<ApiFailure>(error)) {
      const status = error.response?.status ?? 0

      if (status === 401 && path !== '/auth/login' && path !== '/auth/me') {
        window.dispatchEvent(new Event('awb-session-expired'))
      }

      throw new ApiError(
        error.response?.data?.error ?? 'Unable to contact the server. Please retry.',
        status,
        error.response?.data?.details,
      )
    }

    throw error
  }
}
