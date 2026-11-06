import { useSearchParams } from 'react-router'
import { DEFAULT_PAGE_SIZE } from '@awb/contracts'
import { getPage } from '@/utils/pagination'

export function usePagination() {
  const [parameters, setParameters] = useSearchParams()
  const page = getPage(parameters.get('page'))
  const raw = Number(parameters.get('limit'))
  const limit = Number.isInteger(raw) && raw >= 1 && raw <= 100 ? raw : DEFAULT_PAGE_SIZE
  const q = parameters.get('q') ?? ''
  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(parameters)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParameters(next, { replace: true })
  }
  return {
    page,
    limit,
    q,
    onPageChange: (value: number) => update({ page: String(value) }),
    onPageSizeChange: (value: number) => update({ page: '1', limit: String(value) }),
    onSearchChange: (value: string) => update({ page: '1', q: value }),
  }
}
