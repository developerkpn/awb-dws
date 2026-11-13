import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MasterKind, MasterListResult, MasterPullStatus } from '@awb/contracts'
import { ApiError, fetchApi } from '@/utils/api'
import type { MasterListParams } from '@/types/master'

export const masterKeys = {
  all: ['master'] as const,
  statuses: ['master', 'statuses'] as const,
  list: (kind: MasterKind, params: MasterListParams) => ['master', 'list', kind, params] as const,
}

function queryString(params: MasterListParams) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }

  return '?' + search.toString()
}

export function useMasterStatuses() {
  return useQuery({
    queryKey: masterKeys.statuses,
    queryFn: ({ signal }) => fetchApi<MasterPullStatus[]>('/masters', { signal }),
  })
}

export function useMasterList<K extends MasterKind>(
  kind: K,
  params: MasterListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: masterKeys.list(kind, params),
    queryFn: ({ signal }) =>
      fetchApi<MasterListResult<K>>(`/masters/${kind}` + queryString(params), { signal }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function usePullMaster() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (kind: MasterKind) =>
      fetchApi<MasterPullStatus>(`/masters/${kind}/pull`, { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterKeys.all,
      })
    },
  })
}

export function usePullAllMasters() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      fetchApi<MasterPullStatus[]>('/masters/pull', {
        method: 'POST',
        timeout: 120_000,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterKeys.all,
      })
    },
  })
}

/** SAP has no service for this master yet (the API answers 409). */
export const isSapNotAvailable = (error: unknown) =>
  error instanceof ApiError && error.status === 409
