import { useLocation, useNavigate, useSearchParams } from 'react-router'
import {
  registrationPhases,
  registrationSortFields,
  type RegistrationListItem,
  type RegistrationPhase,
} from '@awb/contracts'
import { SkeletonCell, type TableColumn } from '@awb/ui'
import ErrorState from '@/components/ErrorState'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { useRegistrations } from '@/hooks/registration'
import { useNow } from '@/hooks/useNow'
import { useSorting } from '@/hooks/useSorting'
import { Button } from '@/ui/Button'
import { PageHeader } from '@/ui/Card'
import { FormSuccess, Input } from '@/ui/Field'
import { Contactless, Plus, Search } from '@/ui/icons'
import { Table } from '@/ui/Table'
import { endOfDay, startOfDay } from '@/utils/date'
import { getErrorMessage } from '@/utils/errorHandler'
import type { PhaseTab } from '@/types/registration'
import { DriverPhotoButton } from './_components/DriverPhotoButton'
import { LoadCell } from './_components/LoadCell'
import { StageCell } from './_components/StageCell'
import { TimeCell } from './_components/TimeCell'

const PHASE_LABEL: Record<RegistrationPhase, string> = {
  WB_IN: 'Weighbridge in',
  PROCESS: 'In process',
  WB_OUT: 'Weighbridge out',
  REGIST_OUT: 'Registration out',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const EMPTY: Record<PhaseTab['value'], string> = {
  WB_IN: 'No trucks waiting for the weighbridge.',
  PROCESS: 'No trucks in sampling, lab, loading or unloading.',
  WB_OUT: 'No trucks waiting to weigh out.',
  REGIST_OUT: 'No trucks waiting to register out.',
  COMPLETED: 'No completed registrations.',
  CANCELLED: 'No cancelled registrations.',
  ALL: 'No registrations yet.',
}

function parsePhase(value: string | null): PhaseTab['value'] {
  return registrationPhases.find((phase) => phase === value) ?? 'ALL'
}

export default function ListRegistration() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const pagination = usePagination()
  const search = useDebounce(pagination.q, 300)
  const now = useNow(30_000)

  const { sortBy, sortDirection, sorting } = useSorting(
    registrationSortFields,
    'registeredAt',
    'desc',
  )

  const phase = parsePhase(params.get('phase'))
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const created = (location.state as { created?: string } | null)?.created

  const query = useRegistrations({
    page: pagination.page,
    limit: pagination.limit,
    search: search || undefined,
    from: startOfDay(from),
    to: endOfDay(to),
    phase: phase === 'ALL' ? undefined : phase,
    sortBy,
    sortDirection,
  })

  const counts = query.data?.counts

  const tabs: PhaseTab[] = [
    {
      value: 'ALL',
      label: 'All',
      count: counts?.all,
    },
    ...registrationPhases.map((value) => ({
      value,
      label: PHASE_LABEL[value],
      count: counts?.[value],
    })),
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
      key: 'plateNumber',
      header: 'Truck',
      sortKey: 'plateNumber',
      width: '15%',
      skeleton: <SkeletonCell lines={2} width="70%" />,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-stone-900">{row.plateNumber}</p>
          <p className="mt-0.5 text-xs text-stone-500">
            <span className="font-mono">{row.number}</span>
            {row.tankerNumber && ` · Tanker ${row.tankerNumber}`}
          </p>
          {row.cardNumber && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-600">
              <Contactless aria-label="RFID card" className="size-3.5 text-stone-400" />
              <span className="truncate font-mono">{row.cardNumber}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'driverName',
      header: 'Driver & transporter',
      sortKey: 'driverName',
      width: '17%',
      skeleton: <SkeletonCell lines={2} width="75%" />,
      render: (row) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="line-clamp-1 text-stone-900">{row.driverName || '—'}</span>
            <DriverPhotoButton row={row} />
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">
            {row.transporterName || row.transporterCode || 'No transporter'}
          </p>
        </div>
      ),
    },
    {
      key: 'load',
      header: 'Load',
      width: '28%',
      skeleton: <SkeletonCell lines={2} width="85%" />,
      render: (row) => <LoadCell row={row} />,
    },
    {
      key: 'destinations',
      header: 'Destination',
      width: '9%',
      skeleton: <SkeletonCell width="3rem" />,
      render: (row) => row.destinations.join(', ') || '—',
    },
    {
      key: 'stage',
      header: 'Stage',
      width: '18%',
      skeleton: <SkeletonCell lines={2} width="80%" />,
      render: (row) => <StageCell row={row} />,
    },
    {
      key: 'registeredAt',
      header: 'Time in plant',
      sortKey: 'registeredAt',
      width: '13%',
      skeleton: <SkeletonCell lines={2} width="60%" />,
      render: (row) => <TimeCell row={row} now={now} />,
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
        aria-label="Registration stage"
        className="flex gap-1 overflow-x-auto border-b border-stone-200"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={phase === tab.value}
            onClick={() => setFilter('phase', tab.value === 'ALL' ? '' : tab.value)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap ${
              phase === tab.value
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                phase === tab.value ? 'bg-brand-50 text-brand-700' : 'bg-stone-100 text-stone-600'
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
          minWidth="68rem"
          sorting={{
            ...sorting,
            isLoading: query.isFetching,
          }}
          pagination={{
            ...pagination,
            total: query.data?.total ?? 0,
            isLoading: query.isFetching,
          }}
          emptyMessage={EMPTY[phase]}
        />
      )}
    </div>
  )
}
