import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SapMasterImport, SapMasterSummary } from '@awb/contracts'
import { fetchApi } from '@/utils/api'

export function useSapMasterSummary() {
  return useQuery({
    queryKey: ['sap-master'],
    queryFn: ({ signal }) => fetchApi<SapMasterSummary>('/sap-master', { signal }),
    refetchInterval: (query) =>
      query.state.data?.latestImport?.status === 'RUNNING' ? 2000 : false,
  })
}

export function useStartSapMasterImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      fetchApi<SapMasterImport>('/sap-master/imports', {
        method: 'POST',
      }),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: ['sap-master'],
      }),
  })
}
