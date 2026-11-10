import { useSearchParams } from 'react-router'
import type { SortDirection } from '@awb/contracts'
import type { ServerSorting } from '@awb/ui'

export function useSorting<K extends string>(
  fields: readonly K[],
  defaultSortBy: K,
  defaultDirection: SortDirection = 'asc',
) {
  const [parameters, setParameters] = useSearchParams()
  const sortBy = fields.find((field) => field === parameters.get('sortBy')) ?? defaultSortBy
  const rawDirection = parameters.get('sortDirection')

  const sortDirection =
    rawDirection === 'asc' || rawDirection === 'desc' ? rawDirection : defaultDirection

  const sorting: ServerSorting = {
    sortBy,
    direction: sortDirection,
    onSortChange: (key, direction) => {
      if (!fields.some((field) => field === key)) return

      const next = new URLSearchParams(parameters)

      next.set('sortBy', key)
      next.set('sortDirection', direction)
      next.set('page', '1')
      setParameters(next, { replace: true })
    },
  }

  return {
    sortBy,
    sortDirection,
    sorting,
  }
}
