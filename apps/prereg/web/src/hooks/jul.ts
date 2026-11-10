import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JulApprovalChoices, JulRequestDetail } from '@awb/contracts'
import type { JulConfiguration, JulDocumentOption, JulListResponse } from '@/types/jul'
import { fetchApi } from '@/utils/api'

export function useJulConfiguration() {
  return useQuery({
    queryKey: ['jul', 'configuration'],
    queryFn: ({ signal }) => fetchApi<JulConfiguration>('/jul/configuration', { signal }),
  })
}
export function useJulList(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['jul', 'list', params],
    queryFn: ({ signal }) =>
      fetchApi<JulListResponse>('/jul', {
        params,
        signal,
      }),
  })
}
export function useJulRequest(id?: string) {
  return useQuery({
    queryKey: ['jul', 'detail', id],
    queryFn: ({ signal }) => fetchApi<JulRequestDetail>('/jul/' + id, { signal }),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === 'PROCESSING' ? 10000 : false),
  })
}
export function useJulAction() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({
      path,
      data,
      method = 'POST',
    }: {
      path: string
      data?: unknown
      method?: 'POST' | 'PUT'
    }) =>
      fetchApi<JulRequestDetail>('/jul' + path, {
        method,
        data,
      }),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ['jul'],
      }),
  })
}
export function useJulReferences(customerId: string, sto: string, enabled: boolean) {
  return useQuery({
    queryKey: ['jul', 'references', customerId, sto],
    queryFn: ({ signal }) =>
      fetchApi<string[]>('/jul/references', {
        params: {
          customerId,
          sto: sto || undefined,
        },
        signal,
      }),
    enabled,
  })
}
export function useJulStos(customerId: string, reference: string, enabled: boolean) {
  return useQuery({
    queryKey: ['jul', 'stos', customerId, reference],
    queryFn: ({ signal }) =>
      fetchApi<string[]>('/jul/stos', {
        params: {
          customerId,
          reference,
        },
        signal,
      }),
    enabled,
  })
}
export function useJulDocumentLookup() {
  return useMutation({
    mutationFn: (params: { customerId: string; reference: string; sto?: string }) =>
      fetchApi<JulDocumentOption>('/jul/documents', { params }),
  })
}
export function useJulDrivers(customerId: string | undefined, q: string) {
  return useQuery({
    queryKey: ['jul', 'drivers', customerId, q],
    queryFn: ({ signal }) =>
      fetchApi<{ licenseNumber: string; name: string }[]>('/jul/drivers', {
        params: {
          customerId,
          q,
        },
        signal,
      }),
    enabled: q.length >= 2,
  })
}
export function useJulVehicles(customerId: string | undefined, q: string) {
  return useQuery({
    queryKey: ['jul', 'vehicles', customerId, q],
    queryFn: ({ signal }) =>
      fetchApi<string[]>('/jul/vehicles', {
        params: {
          customerId,
          q,
        },
        signal,
      }),
    enabled: q.length >= 2,
  })
}
export function useJulApprovalChoices(documentId: string) {
  return useQuery({
    queryKey: ['jul', 'approvalChoices', documentId],
    queryFn: ({ signal }) =>
      fetchApi<JulApprovalChoices>(`/jul/documents/${documentId}/approval-choices`, { signal }),
  })
}
export function useJulHold() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (data: { documentId: string; quantity: string; reason: string }) =>
      fetchApi('/jul/holds', {
        method: 'POST',
        data,
      }),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ['jul'],
      }),
  })
}
