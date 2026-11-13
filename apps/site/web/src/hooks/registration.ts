import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  RegistrationCardStatus,
  RegistrationCreateData,
  RegistrationCreated,
  RegistrationListResult,
} from '@awb/contracts'
import { ApiError, fetchApi } from '@/utils/api'
import type { RegistrationListParams } from '@/types/registration'

export const registrationKeys = {
  all: ['registration'] as const,
  list: (params: RegistrationListParams) => ['registration', 'list', params] as const,
  card: (cardNumber: string) => ['registration', 'card', cardNumber] as const,
}

export const driverPhotoUrl = (registrationId: string) =>
  `/api/registrations/${encodeURIComponent(registrationId)}/driver-photo`

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

/** Which unfinished registration, if any, still holds the card. */
export function useCardStatus(cardNumber: string) {
  return useQuery({
    queryKey: registrationKeys.card(cardNumber),
    queryFn: ({ signal }) =>
      fetchApi<RegistrationCardStatus>(`/registrations/cards/${encodeURIComponent(cardNumber)}`, {
        signal,
      }),
    enabled: cardNumber.length > 0,
    staleTime: 10_000,
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
