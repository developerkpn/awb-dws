import { useNavigate, useSearchParams } from 'react-router'
import {
  registrationReportSortFields,
  registrationReportStatuses,
  registrationReportTypes,
  type RegistrationReportRow,
  type RegistrationReportStatus,
  type RegistrationReportType,
} from '@awb/contracts'
import { Button, Input, Select, SkeletonCell, Table, type TableColumn } from '@awb/ui'
import { useRegistrationReport, useReportOptions } from '@/hooks/registrationReport'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/hooks/auth'
import ErrorState from '@/components/ErrorState'
import { FileDownload, RefreshCw } from '@/ui/icons'

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PARTIAL: 'Partial',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  COMPLETED: 'Completed',
  SAP_PENDING: 'SAP Pending',
  SAP_RETRY: 'SAP Retry',
  SAP_UNKNOWN: 'SAP Unknown',
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  PARTIAL: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  CANCELLED: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  EXPIRED: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  COMPLETED: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  SAP_PENDING: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  SAP_RETRY: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  SAP_UNKNOWN: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
}

function fmt(date: string | null | undefined) {
  if (!date) return '—'

  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function RegistrationReport() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isInternal = user?.role !== 'CUSTOMER' && user?.role !== 'VENDOR'

  const [params, setParams] = useSearchParams()
  const pagination = usePagination()

  const { sortBy, sortDirection, sorting } = useSorting(
    registrationReportSortFields,
    'requestedAt',
    'desc',
  )

  const search = useDebounce(pagination.q, 300)

  const dateFrom = params.get('dateFrom') ?? ''
  const dateTo = params.get('dateTo') ?? ''
  const dateField = params.get('dateField') ?? 'request'
  const type = (params.get('type') ?? '') as RegistrationReportType | ''
  const status = (params.get('status') ?? '') as RegistrationReportStatus | ''
  const plantId = params.get('plantId') ?? ''
  const partnerId = params.get('partnerId') ?? ''

  const hasActiveFilters = Boolean(
    dateFrom ||
    dateTo ||
    type ||
    status ||
    plantId ||
    partnerId ||
    pagination.q ||
    dateField !== 'request',
  )

  const updateParam = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)

    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }

    next.set('page', '1')
    setParams(next, { replace: true })
  }

  const handleReset = () => {
    pagination.onSearchChange('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const query = useRegistrationReport({
    page: pagination.page,
    limit: pagination.limit,
    sortBy,
    sortDirection,
    dateField: dateField || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    type: type || undefined,
    status: status || undefined,
    plantId: plantId || undefined,
    partnerId: partnerId || undefined,
    search: search || undefined,
  })

  const options = useReportOptions()

  const handleExport = () => {
    const qs = new URLSearchParams()

    if (dateField) qs.set('dateField', dateField)

    if (dateFrom) qs.set('dateFrom', dateFrom)

    if (dateTo) qs.set('dateTo', dateTo)

    if (type) qs.set('type', type)

    if (status) qs.set('status', status)

    if (plantId) qs.set('plantId', plantId)

    if (partnerId) qs.set('partnerId', partnerId)

    if (search) qs.set('search', search)

    qs.set('sortBy', sortBy)
    qs.set('sortDirection', sortDirection)

    window.open('/api/registration-reports/export?' + qs.toString(), '_blank')
  }

  const columns: TableColumn<RegistrationReportRow>[] = [
    {
      key: 'registrationNumber',
      header: 'Registration',
      sortKey: 'registrationNumber',
      width: '14%',
      skeleton: <SkeletonCell lines={2} width="80%" />,
      render: (row) => (
        <div>
          <p className="font-semibold text-stone-900 dark:text-stone-100">
            {row.registrationNumber}
          </p>
          <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 bg-stone-100 text-[11px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            {row.type}
          </span>
        </div>
      ),
    },
    {
      key: 'documentNumber',
      header: 'DO / PO number',
      sortKey: 'documentNumber',
      width: '15%',
      skeleton: <SkeletonCell lines={2} width="75%" />,
      render: (row) => (
        <div>
          <p className="font-medium text-stone-800 dark:text-stone-200">{row.documentNumber}</p>
          {row.documentItem && (
            <p className="mt-0.5 text-xs text-stone-400">Item {row.documentItem}</p>
          )}
          {row.loadingNoteNumber && (
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              LN {row.loadingNoteNumber}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'partnerName',
      header: 'Customer / vendor',
      sortKey: 'partnerName',
      width: '15%',
      skeleton: <SkeletonCell lines={2} width="80%" />,
      render: (row) => (
        <div>
          <p className="font-medium text-stone-800 dark:text-stone-200">{row.partner.name}</p>
          <p className="mt-0.5 text-xs text-stone-400">{row.plant.name}</p>
        </div>
      ),
    },
    {
      key: 'requestedAt',
      header: 'Request date',
      sortKey: 'requestedAt',
      width: '10%',
      skeleton: <SkeletonCell width="6rem" />,
      render: (row) => fmt(row.requestedAt),
    },
    {
      key: 'loadingDate',
      header: 'Loading date',
      sortKey: 'loadingDate',
      width: '10%',
      skeleton: <SkeletonCell width="6rem" />,
      render: (row) => fmt(row.loadingDate),
    },
    {
      key: 'driverName',
      header: 'Driver / vehicle',
      sortKey: 'driverName',
      width: '14%',
      skeleton: <SkeletonCell lines={2} width="70%" />,
      render: (row) => (
        <div>
          <p className="text-stone-800 dark:text-stone-200">{row.driverName ?? '—'}</p>
          {row.vehiclePlateNumber && (
            <p className="mt-0.5 font-mono text-xs text-stone-500 dark:text-stone-400">
              {row.vehiclePlateNumber}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'plannedQuantity',
      header: 'Planned qty',
      sortKey: 'plannedQuantity',
      width: '11%',
      skeleton: <SkeletonCell width="5rem" />,
      render: (row) => (
        <span className="font-medium text-stone-900 dark:text-stone-100">
          {Number(row.plannedQuantity).toLocaleString('en-US')} {row.uom}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      width: '11%',
      skeleton: <SkeletonCell width="6rem" />,
      render: (row) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_COLORS[row.status] ?? 'bg-stone-100 text-stone-500'
          }`}
        >
          {STATUS_LABELS[row.status] ?? row.status}
        </span>
      ),
    },
  ]

  const handleRowClick = (row: RegistrationReportRow) => {
    const path = row.type === 'JUL' ? `/jul/${row.registrationId}` : `/bel/${row.registrationId}`

    navigate(path)
  }

  return (
    <div className="space-y-4">
      {/* Modern Filter Toolbar */}
      <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-900/40 space-y-3">
        {/* Row 1: Search + Quick Selects + Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input
              aria-label="Search registrations"
              placeholder="Search registration, DO/PO, plate, license…"
              value={pagination.q}
              onChange={(e) => pagination.onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="w-36">
            <Select
              aria-label="Registration type"
              value={type}
              onChange={(e) => updateParam({ type: e.target.value })}
            >
              <option value="">All types</option>
              {registrationReportTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-44">
            <Select
              aria-label="Status"
              value={status}
              onChange={(e) => updateParam({ status: e.target.value })}
            >
              <option value="">All statuses</option>
              {registrationReportStatuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-stone-500 hover:text-stone-900"
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                Reset
              </Button>
            )}

            <Button variant="outline" onClick={handleExport}>
              <FileDownload className="size-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Row 2: Date Range Picker + Internal Role Scope (Plant / Partner) */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-200/50 dark:border-stone-800/60">
          {/* Unified Date Filter Capsule */}
          <div className="flex items-center rounded-lg border border-stone-300/80 bg-white shadow-xs dark:border-stone-700 dark:bg-stone-900">
            <div className="w-36 border-r border-stone-200 dark:border-stone-700">
              <select
                aria-label="Date field"
                value={dateField}
                onChange={(e) => updateParam({ dateField: e.target.value })}
                className="w-full bg-transparent px-3 py-2 text-xs font-medium text-stone-700 focus:outline-none dark:text-stone-200"
              >
                <option value="request">Request date</option>
                <option value="loading">Loading date</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1">
              <input
                type="date"
                aria-label="Date from"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => updateParam({ dateFrom: e.target.value })}
                className="bg-transparent text-xs text-stone-700 focus:outline-none dark:text-stone-200"
              />
              <span className="text-xs text-stone-400">to</span>
              <input
                type="date"
                aria-label="Date to"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => updateParam({ dateTo: e.target.value })}
                className="bg-transparent text-xs text-stone-700 focus:outline-none dark:text-stone-200"
              />
            </div>
          </div>

          {/* Plant filter — internal only */}
          {isInternal && options.data && options.data.plants.length > 0 && (
            <div className="w-48">
              <Select
                aria-label="Plant"
                value={plantId}
                onChange={(e) => updateParam({ plantId: e.target.value })}
              >
                <option value="">All plants</option>
                {options.data.plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Partner filter — internal only */}
          {isInternal && options.data && options.data.partners.length > 0 && (
            <div className="w-56">
              <Select
                aria-label="Customer / vendor"
                value={partnerId}
                onChange={(e) => updateParam({ partnerId: e.target.value })}
              >
                <option value="">All partners</option>
                {options.data.partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.type}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Main Report Table */}
      {query.isError ? (
        <ErrorState message="Unable to load registration report." onRetry={() => query.refetch()} />
      ) : (
        <Table
          columns={columns}
          data={query.data?.items ?? []}
          keyExtractor={(row) => row.id}
          isLoading={query.isPending}
          onRowClick={handleRowClick}
          sorting={{
            ...sorting,
            isLoading: query.isFetching,
          }}
          pagination={{
            ...pagination,
            total: query.data?.total ?? 0,
            isLoading: query.isFetching,
          }}
          emptyMessage="No registration records found."
        />
      )}
    </div>
  )
}
