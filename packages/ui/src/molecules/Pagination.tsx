import { useId } from 'react'
import { DEFAULT_PAGE_SIZE } from '@awb/contracts'
import { Button } from '../atoms/Button'
import { Skeleton } from '../atoms/Skeleton'
import '../styles/components.css'

export interface ServerPagination {
  page: number
  limit?: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (limit: number) => void
  isLoading?: boolean
}

export function Pagination({
  page,
  limit = DEFAULT_PAGE_SIZE,
  total,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: ServerPagination) {
  const id = useId()
  const pages = Math.max(1, Math.ceil(total / limit))
  const start = total === 0 || page > pages ? 0 : (page - 1) * limit + 1
  const end = start === 0 ? 0 : Math.min(page * limit, total)
  const sizes = [...new Set([20, 50, 100, limit])].sort((a, b) => a - b)

  return (
    <nav className="ui-pagination" aria-label="Table pagination">
      <span className="ui-pagination-summary" aria-live="polite">
        {isLoading ? (
          <Skeleton
            style={{
              width: '7rem',
              height: '0.75rem',
            }}
          />
        ) : (
          `${start}–${end} of ${total} results`
        )}
      </span>
      <div className="ui-pagination-controls">
        <label htmlFor={id}>Rows per page</label>
        <select
          id={id}
          aria-label="Rows per page"
          value={limit}
          disabled={isLoading}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="ui-pagination-page">
          {isLoading ? (
            <Skeleton
              style={{
                width: '5rem',
                height: '0.75rem',
              }}
            />
          ) : (
            `Page ${page} of ${pages}`
          )}
        </span>
        <Button
          variant="secondary"
          size="sm"
          aria-label="Previous page"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          aria-label="Next page"
          disabled={page >= pages || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
