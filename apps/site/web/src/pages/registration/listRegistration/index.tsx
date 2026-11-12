import { useLocation, useNavigate, useSearchParams } from 'react-router'
import {
  registrationSortFields,
  registrationStatuses,
  type RegistrationListItem,
  type RegistrationStatus,
} from '@awb/contracts'
import { SkeletonCell, type TableColumn } from '@awb/ui'
import ErrorState from '@/components/ErrorState'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { useRegistrations } from '@/hooks/registration'
import { useSorting } from '@/hooks/useSorting'
import { Button } from '@/ui/Button'
import { PageHeader } from '@/ui/Card'
import { FormSuccess, Input } from '@/ui/Field'
import { Plus, Search } from '@/ui/icons'
import { Table } from '@/ui/Table'
import { endOfDay, formatDateTime, startOfDay } from '@/utils/date'
import { getErrorMessage } from '@/utils/errorHandler'
import type { StatusTab } from '@/types/registration'

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  OPEN: 'Inside plant',
  CHECKED_OUT: 'Checked out',
  CANCELLED: 'Cancelled',
}

const STATUS_PILL: Record<RegistrationStatus, string> = {
  OPEN: 'Inside',
  CHECKED_OUT: 'Out',
  CANCELLED: 'Cancelled',
}

const STATUS_CLASS: Record<RegistrationStatus, string> = {
  OPEN: 'bg-amber-50 text-amber-800 ring-amber-200',
  CHECKED_OUT: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  CANCELLED: 'bg-stone-100 text-stone-600 ring-stone-200',
}

const EMPTY: Record<StatusTab['value'], string> = {
  OPEN: 'No trucks inside the plant.',
  CHECKED_OUT: 'No trucks have checked out.',
  CANCELLED: 'No cancelled registrations.',
  ALL: 'No registrations yet.',
}

function parseStatus(value: string | null): StatusTab['value'] {
  if (value === 'ALL') return 'ALL'

  return registrationStatuses.find((status) => status === value) ?? 'OPEN'
}

export default function ListRegistration() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const pagination = usePagination()
  const search = useDebounce(pagination.q, 300)

  const { sortBy, sortDirection, sorting } = useSorting(
    registrationSortFields,
    'registeredAt',
    'desc',
  )

  const status = parseStatus(params.get('status'))
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const created = (location.state as { created?: string } | null)?.created

  const query = useRegistrations({
    page: pagination.page,
    limit: pagination.limit,
    search: search || undefined,
    from: startOfDay(from),
    to: endOfDay(to),
    status: status === 'ALL' ? undefined : status,
    sortBy,
    sortDirection,
  })

  const counts = query.data?.counts

  const tabs: StatusTab[] = [
    {
      value: 'OPEN',
      label: STATUS_LABEL.OPEN,
      count: counts?.open,
    },
    {
      value: 'CHECKED_OUT',
      label: STATUS_LABEL.CHECKED_OUT,
      count: counts?.checkedOut,
    },
    {
      value: 'CANCELLED',
      label: STATUS_LABEL.CANCELLED,
      count: counts?.cancelled,
    },
    {
      value: 'ALL',
      label: 'All',
      count: counts?.all,
    },
  ]

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)

    if (value) next.set(key, value)
    else next.delete(key)

    next.set('page', '1')
    setParams(next, { replace: true })
  }

  const columns: TableColumn<RegistrationListItem>[] = [
    {
      key: 'number',
      header: 'Registration',
      sortKey: 'number',
      width: '13%',
      skeleton: <SkeletonCell width="6rem" />,
      render: (row) => <span className="font-mono font-semibold text-stone-900">{row.number}</span>,
    },
    {
      key: 'plateNumber',
      header: 'Truck',
      sortKey: 'plateNumber',
      width: '15%',
      skeleton: <SkeletonCell lines={2} width="70%" />,
      render: (row) => (
        <div>
          <p className="font-semibold text-stone-900">{row.plateNumber}</p>
          <p className="mt-0.5 text-xs text-stone-500">
            {[row.transporterCode, row.tankerNumber && `Tanker ${row.tankerNumber}`]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'driverName',
      header: 'Driver',
      sortKey: 'driverName',
      width: '17%',
      skeleton: <SkeletonCell lines={2} width="75%" />,
      render: (row) => (
        <div>
          <p className="text-stone-900">{row.driverName || '—'}</p>
          <p className="mt-0.5 text-xs text-stone-500">{row.licenseNumber || ''}</p>
        </div>
      ),
    },
    {
      key: 'dos',
      header: 'Load',
      width: '21%',
      skeleton: <SkeletonCell lines={2} width="80%" />,
      render: (row) => (
        <div className="space-y-1">
          {row.dos.slice(0, 2).map((item) => (
            <p key={item.doNumber} className="flex items-center gap-1.5">
              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-semibold text-stone-700">
                {item.transactionCode}
              </span>
              <span className="truncate text-stone-800">{item.doNumber}</span>
            </p>
          ))}
          {row.dos.length > 2 && (
            <p className="text-xs text-stone-500">+{row.dos.length - 2} more DO</p>
          )}
        </div>
      ),
    },
    {
      key: 'destinations',
      header: 'Destination',
      width: '10%',
      skeleton: <SkeletonCell width="4rem" />,
      render: (row) => row.destinations.join(', ') || '—',
    },
    {
      key: 'registeredAt',
      header: 'Arrived',
      sortKey: 'registeredAt',
      width: '13%',
      skeleton: <SkeletonCell lines={2} width="70%" />,
      render: (row) => (
        <div>
          <p className="text-stone-900">{formatDateTime(row.registeredAt)}</p>
          <p className="mt-0.5 text-xs text-stone-500">{row.createdBy ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      width: '11%',
      skeleton: <SkeletonCell width="5rem" />,
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ${STATUS_CLASS[row.status]}`}
        >
          {STATUS_PILL[row.status]}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Truck registrations"
        subtitle="Trucks registered at the gate."
        action={
          <Button onClick={() => navigate('/registrations/new')}>
            <Plus className="size-4" />
            New registration
          </Button>
        }
      />

      <FormSuccess message={created ? `Registration ${created} saved.` : null} />

      <div
        role="tablist"
        aria-label="Registration status"
        className="flex gap-1 overflow-x-auto border-b border-stone-200"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setFilter('status', tab.value === 'OPEN' ? '' : tab.value)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap ${
              status === tab.value
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                status === tab.value ? 'bg-brand-50 text-brand-700' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {tab.count ?? '–'}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Search registrations"
          placeholder="Search plate, driver, registration…"
          leadingIcon={<Search className="size-4" />}
          value={pagination.q}
          onChange={(event) => pagination.onSearchChange(event.target.value)}
          className="sm:w-80"
        />
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <Input
            type="date"
            aria-label="From date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFilter('from', event.target.value)}
          />
          <span>–</span>
          <Input
            type="date"
            aria-label="To date"
            value={to}
            min={from || undefined}
            onChange={(event) => setFilter('to', event.target.value)}
          />
        </div>
      </div>

      {query.isError ? (
        <ErrorState
          message={getErrorMessage(query.error, 'Unable to load registrations.')}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <Table
          columns={columns}
          data={query.data?.items ?? []}
          keyExtractor={(row) => row.id}
          isLoading={query.isPending}
          minWidth="64rem"
          sorting={{
            ...sorting,
            isLoading: query.isFetching,
          }}
          pagination={{
            ...pagination,
            total: query.data?.total ?? 0,
            isLoading: query.isFetching,
          }}
          emptyMessage={EMPTY[status]}
        />
      )}
    </div>
  )
}
