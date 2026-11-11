import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/utils/api'
import type { RegistrationReportList, RegistrationReportOptions } from '@awb/contracts'
import type { RegistrationReportParams } from '@/types/registrationReport'

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

export const reportKeys = {
  all: ['report'] as const,
  lists: ['report', 'list'] as const,
  list: (params: RegistrationReportParams) => ['report', 'list', params] as const,
  options: ['report', 'options'] as const,
}

export function useRegistrationReport(params: RegistrationReportParams) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: ({ signal }) =>
      fetchApi<RegistrationReportList>(
        '/registration-reports' +
          queryString({
            page: params.page,
            limit: params.limit,
            sortBy: params.sortBy,
            sortDirection: params.sortDirection,
            dateField: params.dateField,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            type: params.type,
            status: params.status,
            plantId: params.plantId,
            partnerId: params.partnerId,
            search: params.search,
          }),
        { signal },
      ),
  })
}

export function useReportOptions() {
  return useQuery({
    queryKey: reportKeys.options,
    queryFn: ({ signal }) =>
      fetchApi<RegistrationReportOptions>('/registration-reports/options', { signal }),
    staleTime: 60_000,
  })
}
