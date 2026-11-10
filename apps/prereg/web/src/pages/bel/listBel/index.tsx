import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import {
  belRequestStatus,
  belSortFields,
  type BelRequestStatus,
  type BelRequestSummary,
} from '@awb/contracts'
import { Button, Input, PageHeader, Select, Table, type TableColumn } from '@awb/ui'
import ErrorState from '@/components/ErrorState'
import { PERMISSION } from '@/constant/PERMISSION'
import { useAuth } from '@/hooks/auth'
import { useBelList } from '@/hooks/bel'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'
import { Badge } from '@/ui'
import { Plus, Search } from '@/ui/icons'
import { tableLayout } from '@/ui/loadingLayouts'
import { getErrorMessage } from '@/utils/errorHandler'
import { hasPermission } from '@/utils/permission'
import { BEL_STATUS_BADGE } from '../_components/belStatus'

const STATUS_VALUES = belRequestStatus.options

export default function BelList({ review = false }: { review?: boolean }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { page, limit, q, onPageChange, onPageSizeChange, onSearchChange } = usePagination()
  const { sortBy, sortDirection, sorting } = useSorting(belSortFields, 'createdAt', 'desc')

  const [searchInput, setSearchInput] = useState(q)
  const debouncedSearch = useDebounce(searchInput, 250)

  useDocumentTitle(review ? 'BEL review' : 'BEL pre-registrations')

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  useEffect(() => {
    if (debouncedSearch !== q) {
      onSearchChange(debouncedSearch)
    }
  }, [debouncedSearch, onSearchChange, q])

  const rawStatus = searchParams.get('status')
  const parsedStatus = STATUS_VALUES.find((status) => status === rawStatus)

  const effectiveStatus: BelRequestStatus | undefined =
    rawStatus === 'ALL' ? undefined : (parsedStatus ?? (review ? 'SUBMITTED' : undefined))

  const selectStatusValue = rawStatus === 'ALL' ? 'ALL' : (effectiveStatus ?? 'ALL')

  const listQuery = useBelList({
    page,
    limit,
    sortBy,
    sortOrder: sortDirection,
    search: q.trim() || undefined,
    status: effectiveStatus,
  })

  if (user?.role === 'CUSTOMER') {
    return <Navigate to="/forbidden" replace />
  }

  const canCreate = hasPermission(user, PERMISSION.PREREG.CREATE)
  const canUpdate = hasPermission(user, PERMISSION.PREREG.UPDATE)

  const handleStatusChange = (nextStatus: string) => {
    const next = new URLSearchParams(searchParams)

    if (nextStatus === 'ALL') {
      next.set('status', 'ALL')
    } else {
      next.set('status', nextStatus)
    }

    next.set('page', '1')

    setSearchParams(next, {
      replace: true,
    })
  }

  const columns: TableColumn<BelRequestSummary>[] = [
    {
      key: 'number',
      header: 'Registration',
      sortKey: 'number',
      render: (row) => (
        <div className="space-y-0.5">
          <Link
            to={`/bel/${row.id}`}
            onClick={(event) => event.stopPropagation()}
            className="font-mono text-xs font-semibold text-brand-700 hover:underline"
          >
            {row.number}
          </Link>
          <p className="text-xs text-stone-500">
            {row.lineCount} line{row.lineCount === 1 ? '' : 's'}
            {row.documents.length ? ` · PO ${row.documents.join(', ')}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Vendor',
      sortKey: 'vendor',
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-stone-900">{row.vendor.name}</p>
          <p className="font-mono text-xs text-stone-500">{row.vendor.username}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      render: (row) => {
        const badge = BEL_STATUS_BADGE[row.status]

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {row.status === 'APPROVED' && (
              <span className="text-xs text-stone-500">
                {row.approvedCount}/{row.lineCount} staged
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortKey: 'createdAt',
      render: (row) => (
        <span className="text-xs text-stone-600">
          {new Date(row.createdAt).toLocaleString('en-GB', {
            timeZone: 'Asia/Jakarta',
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          {!review && canUpdate && ['DRAFT', 'REJECTED'].includes(row.status) && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/bel/${row.id}/edit`)}>
              Edit
            </Button>
          )}
          <Button
            size="sm"
            variant={review && row.status === 'SUBMITTED' ? 'primary' : 'secondary'}
            onClick={() => navigate(`/bel/${row.id}`)}
          >
            {review && row.status === 'SUBMITTED' ? 'Review' : 'View'}
          </Button>
        </div>
      ),
    },
  ]

  const rows = listQuery.data?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={review ? 'BEL review' : 'BEL registrations'}
        subtitle={
          review
            ? 'Review submitted vendor PO allocations and stage approved lines to PREREG_BEL_SAP (no SAP password or loading note trigger).'
            : 'Pre-register vendor deliveries against SAP PO items without DP check or automatic loading note creation.'
        }
        action={
          !review && canCreate ? (
            <Button icon={<Plus className="size-4" />} onClick={() => navigate('/bel/new')}>
              New BEL registration
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <Input
            aria-label="Search BEL registrations"
            leadingIcon={<Search className="size-4" />}
            placeholder="Search BEL number, PO number, vendor, SIM, or plate..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <div className="w-full sm:w-52">
          <Select
            aria-label="Filter BEL status"
            value={selectStatusValue}
            onChange={(event) => handleStatusChange(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            {STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {BEL_STATUS_BADGE[status].label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {listQuery.isError ? (
        <ErrorState
          message={getErrorMessage(listQuery.error, 'Could not load BEL registrations.')}
          onRetry={() => void listQuery.refetch()}
        />
      ) : (
        <Table
          columns={tableLayout('jul', columns)}
          data={rows}
          keyExtractor={(row) => row.id}
          isLoading={listQuery.isLoading}
          sorting={{
            ...sorting,
            isLoading: listQuery.isFetching,
          }}
          pagination={{
            page,
            limit,
            total: listQuery.data?.total ?? 0,
            onPageChange,
            onPageSizeChange,
            isLoading: listQuery.isFetching,
          }}
          emptyMessage={
            review ? 'No BEL registrations waiting in this queue.' : 'No BEL registrations found.'
          }
          emptyDescription={
            review
              ? 'Submitted vendor PO allocations will appear here once submitted.'
              : 'Create a BEL pre-registration to allocate deliveries against SAP PO items.'
          }
          onRowClick={(row) => navigate(`/bel/${row.id}`)}
        />
      )}
    </div>
  )
}
