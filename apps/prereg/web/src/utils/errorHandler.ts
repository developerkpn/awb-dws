import { ApiError } from '@/utils/api'

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please retry.') {
  if (error instanceof ApiError && error.details) {
    const details = Object.values(error.details).flat().filter(Boolean).join(' ')

    if (details) return details
  }

  return error instanceof Error ? error.message : fallback
}
