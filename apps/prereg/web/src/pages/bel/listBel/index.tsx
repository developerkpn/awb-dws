import { useNavigate, useSearchParams } from 'react-router'
import {
  belSortFields,
  belRequestStatus,
  type BelRequestStatus,
  type BelRequestSummary,
} from '@awb/contracts'
import { Button, Input, Select, PageHeader, SkeletonCell, Table, type TableColumn } from '@awb/ui'
import { useBelList } from '@/hooks/bel'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/hooks/auth'
import { hasPermission } from '@/utils/permission'
import ErrorState from '@/components/ErrorState'
import { ArrowRight, Plus } from '@/ui/icons'

export default function ListBel({ review = false }: { review?: boolean }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const pagination = usePagination()
  const { sortBy, sortDirection, sorting } = useSorting(belSortFields, 'createdAt', 'desc')
  const status = params.get('status') ?? (review ? 'SUBMITTED' : '')
  const search = useDebounce(pagination.q, 300)

  const query = useBelList({
    page: pagination.page,
    limit: pagination.limit,
    sortBy,
    sortOrder: sortDirection,
    status: status ? (status as BelRequestStatus) : undefined,
    search: search || undefined,
  })

  const columns: TableColumn<BelRequestSummary>[] = [
    {
      key: 'number',
      header: 'Registration',
      sortKey: 'number',
      width: '24%',
      skeleton: <SkeletonCell lines={2} width="80%" />,
      render: (row) => (
        <div>
          <p className="font-medium text-stone-900">{row.number.slice(0, 16)}</p>
          <p className="mt-1 text-xs text-stone-500">
            {row.documents.slice(0, 2).join(', ')}
            {row.documents.length > 2 ? ` +${row.documents.length - 2}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer / vendor',
      sortKey: 'vendor',
      width: '24%',
      skeleton: <SkeletonCell lines={2} width="75%" />,
      render: (row) => (
        <div>
          <p>{row.vendor.name}</p>
          <p className="mt-1 text-xs text-stone-500">{row.vendor.username}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      width: '20%',
      skeleton: <SkeletonCell lines={2} width="70%" />,
      render: (row) => (
        <div>
          <p>{row.status.replaceAll('_', ' ')}</p>
          <p className="mt-1 text-xs text-stone-500">
            {row.approvedCount} / {row.lineCount} lines
          </p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortKey: 'createdAt',
      width: '20%',
      skeleton: <SkeletonCell width="6rem" />,
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '12%',
      skeleton: <SkeletonCell kind="actions" count={1} />,
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Open ${row.number}`}
          onClick={() => navigate('/bel/' + row.id)}
        >
          <ArrowRight className="size-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={review ? 'BEL review' : 'BEL registrations'}
        subtitle={
          review
            ? 'Review vendor purchase deliveries against SAP purchase orders.'
            : 'Plan vendor deliveries using your SAP purchase orders.'
        }
        action={
          !review && hasPermission(user, 'prereg:create') ? (
            <Button onClick={() => navigate('/bel/new')}>
              <Plus className="size-4" />
              New registration
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Search BEL registrations"
          placeholder="Search registrations or documents…"
          value={pagination.q}
          onChange={(event) => pagination.onSearchChange(event.target.value)}
          className="sm:max-w-sm"
        />
        <Select
          aria-label="Registration status"
          value={status}
          onChange={(event) => {
            const next = new URLSearchParams(params)

            next.set('status', event.target.value)
            next.set('page', '1')
            setParams(next)
          }}
        >
          <option value="">All statuses</option>
          {belRequestStatus.options.map((value) => (
            <option key={value} value={value}>
              {value.replaceAll('_', ' ')}
            </option>
          ))}
        </Select>
      </div>
      {query.isError ? (
        <ErrorState message="Unable to load BEL registrations." onRetry={() => query.refetch()} />
      ) : (
        <Table
          columns={columns}
          data={query.data?.items ?? []}
          keyExtractor={(row) => row.id}
          isLoading={query.isPending}
          sorting={{
            ...sorting,
            isLoading: query.isFetching,
          }}
          pagination={{
            ...pagination,
            total: query.data?.total ?? 0,
            isLoading: query.isFetching,
          }}
          emptyMessage="No BEL registrations found."
        />
      )}
    </div>
  )
}
