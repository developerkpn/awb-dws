import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/utils/api'
import type {
  DriverRequestDetail,
  DriverRequestFormData,
  DriverRequestsResponse,
  ListDriverRequestsQuery,
  TransporterOption,
  UploadedDocument,
} from '@/types/driverRequest'

export const driverRequestKeys = {
  all: ['driverRequests'] as const,
  lists: ['driverRequests', 'list'] as const,
  list: (query: ListDriverRequestsQuery) => ['driverRequests', 'list', query] as const,
  detail: (id: string) => ['driverRequests', 'detail', id] as const,
  transporters: () => ['driverRequests', 'transporters'] as const,
}

export function useDriverRequests(query: ListDriverRequestsQuery = {}) {
  return useQuery({
    queryKey: driverRequestKeys.list(query),
    queryFn: async ({ signal }) => {
      const params = Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
      )
      return fetchApi<DriverRequestsResponse>('/driver-requests', {
        params,
        signal,
      })
    },
  })
}

export function useDriverRequest(id: string, enabled = true) {
  return useQuery({
    queryKey: driverRequestKeys.detail(id),
    queryFn: ({ signal }) => fetchApi<DriverRequestDetail>(`/driver-requests/${id}`, { signal }),
    enabled: !!id && enabled,
  })
}

export function useTransporters() {
  return useQuery({
    queryKey: driverRequestKeys.transporters(),
    queryFn: ({ signal }) =>
      fetchApi<TransporterOption[]>('/driver-requests/transporters', { signal }),
    staleTime: 60_000,
  })
}

function useInvalidateDriverRequests() {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: driverRequestKeys.all })
  }
}

export function useSubmitDriverRequest() {
  const invalidate = useInvalidateDriverRequests()
  return useMutation({
    mutationFn: (data: DriverRequestFormData) =>
      fetchApi<DriverRequestDetail>('/driver-requests', {
        method: 'POST',
        data,
      }),
    onSuccess: invalidate,
  })
}

export function useResubmitDriverRequest() {
  const invalidate = useInvalidateDriverRequests()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DriverRequestFormData }) =>
      fetchApi<DriverRequestDetail>(`/driver-requests/${id}`, {
        method: 'PUT',
        data,
      }),
    onSuccess: invalidate,
  })
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: async ({ file, category }: { file: File; category: 'sim' | 'driver' | 'stnk' }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      return fetchApi<UploadedDocument>('/documents/upload', {
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
  })
}
