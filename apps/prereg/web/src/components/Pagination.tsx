import { Button } from '@awb/ui'

interface PaginationProps {
  page: number
  limit: number
  total: number
  isLoading?: boolean
  onPageChange: (page: number) => void
}

export default function Pagination({
  page,
  limit,
  total,
  isLoading,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="awb-toolbar">
      <Button
        variant="secondary"
        disabled={page === 1 || isLoading}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {page} of {Math.max(1, Math.ceil(total / limit))}
      </span>
      <Button
        variant="secondary"
        disabled={page * limit >= total || isLoading}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  )
}
