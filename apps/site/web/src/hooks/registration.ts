import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  RegistrationCreateData,
  RegistrationCreated,
  RegistrationListResult,
} from '@awb/contracts'
import { ApiError, fetchApi } from '@/utils/api'
import type { RegistrationListParams } from '@/types/registration'

export const registrationKeys = {
  all: ['registration'] as const,
  list: (params: RegistrationListParams) => ['registration', 'list', params] as const,
}

function queryString(params: RegistrationListParams) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }

  return '?' + search.toString()
}

export function useRegistrations(params: RegistrationListParams) {
  return useQuery({
    queryKey: registrationKeys.list(params),
    queryFn: ({ signal }) =>
      fetchApi<RegistrationListResult>('/registrations' + queryString(params), { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useCreateRegistration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegistrationCreateData) =>
      fetchApi<RegistrationCreated>('/registrations', {
        method: 'POST',
        data,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: registrationKeys.all,
      })
    },
  })
}

/** Field errors from a 422 response, keyed by form field. */
export function serverFieldErrors(error: unknown) {
  return error instanceof ApiError ? (error.details ?? {}) : {}
}
