import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BelPoItemChoice } from '@awb/contracts'
import { fetchApi } from '@/utils/api'
import type {
  BelApprovePayload,
  BelDetailData,
  BelListParams,
  BelListResult,
  BelMasterDriver,
  BelMasterVehicle,
  BelReasonPayload,
  BelSavePayload,
  BelVendorOption,
} from '@/types/bel'

export const belKeys = {
  all: ['bel'] as const,
  vendors: ['bel', 'vendors'] as const,
  poItems: (vendorId?: string) => ['bel', 'po-items', vendorId ?? 'self'] as const,
  drivers: (q: string, vendorId?: string) => ['bel', 'drivers', vendorId ?? 'self', q] as const,
  vehicles: (q: string, vendorId?: string) => ['bel', 'vehicles', vendorId ?? 'self', q] as const,
  lists: ['bel', 'list'] as const,
  list: (params: BelListParams) => ['bel', 'list', params] as const,
  detail: (id: string) => ['bel', 'detail', id] as const,
}

function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }

  const encoded = search.toString()

  return encoded ? '?' + encoded : ''
}

export function useBelVendors(enabled = true) {
  return useQuery({
    queryKey: belKeys.vendors,
    queryFn: ({ signal }) => fetchApi<BelVendorOption[]>('/bel/vendors', { signal }),
    enabled,
  })
}

export function useBelPoItems(vendorId?: string, enabled = true) {
  return useQuery({
    queryKey: belKeys.poItems(vendorId),
    queryFn: ({ signal }) =>
      fetchApi<BelPoItemChoice[]>('/bel/po-items' + queryString({ vendorId }), { signal }),
    enabled,
  })
}

export function useBelDrivers(q: string, vendorId?: string, enabled = true) {
  return useQuery({
    queryKey: belKeys.drivers(q, vendorId),
    queryFn: ({ signal }) =>
      fetchApi<BelMasterDriver[]>(
        '/bel/drivers' +
          queryString({
            q: q.trim() || undefined,
            vendorId,
          }),
        { signal },
      ),
    enabled,
    staleTime: 30_000,
  })
}

export function useBelVehicles(q: string, vendorId?: string, enabled = true) {
  return useQuery({
    queryKey: belKeys.vehicles(q, vendorId),
    queryFn: ({ signal }) =>
      fetchApi<BelMasterVehicle[]>(
        '/bel/vehicles' +
          queryString({
            q: q.trim() || undefined,
            vendorId,
          }),
        { signal },
      ),
    enabled,
    staleTime: 30_000,
  })
}

export function useBelList(params: BelListParams) {
  return useQuery({
    queryKey: belKeys.list(params),
    queryFn: ({ signal }) =>
      fetchApi<BelListResult>(
        '/bel' +
          queryString({
            page: params.page,
            limit: params.limit,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
            search: params.search,
            status: params.status,
          }),
        { signal },
      ),
  })
}

export function useBelDetail(id?: string) {
  return useQuery({
    queryKey: belKeys.detail(id ?? ''),
    queryFn: ({ signal }) => fetchApi<BelDetailData>(`/bel/${id}`, { signal }),
    enabled: Boolean(id),
  })
}

export function useCreateBel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BelSavePayload) =>
      fetchApi<BelDetailData>('/bel', {
        method: 'POST',
        data,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: belKeys.all,
      })
    },
  })
}

export function useUpdateBel(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BelSavePayload) =>
      fetchApi<BelDetailData>(`/bel/${id}`, {
        method: 'PUT',
        data,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: belKeys.all,
      })
    },
  })
}

export function useSubmitBel(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (version?: number) =>
      fetchApi<BelDetailData>(`/bel/${id}/submit`, {
        method: 'POST',
        data: version
          ? {
              version,
            }
          : {},
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: belKeys.all,
      })
    },
  })
}

export function useSubmitBelRegistration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, version }: { id: string; version?: number }) =>
      fetchApi<BelDetailData>(`/bel/${id}/submit`, {
        method: 'POST',
        data: version
          ? {
              version,
            }
          : {},
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: belKeys.all,
      })
    },
  })
}

export function useApproveBel(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BelApprovePayload = {}) =>
      fetchApi<BelDetailData>(`/bel/${id}/approve`, {
        method: 'POST',
        data,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: belKeys.all,
      })
    },
  })
}

export function useRejectBel(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BelReasonPayload) =>
      fetchApi<BelDetailData>(`/bel/${id}/reject`, {
        method: 'POST',
        data,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: belKeys.all,
      })
    },
  })
}

export function useCancelBel(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BelReasonPayload) =>
      fetchApi<BelDetailData>(`/bel/${id}/cancel`, {
        method: 'POST',
        data,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: belKeys.all,
      })
    },
  })
}
