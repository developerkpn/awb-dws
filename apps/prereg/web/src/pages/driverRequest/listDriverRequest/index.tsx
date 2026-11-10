import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Button, Select, SkeletonCell } from '@awb/ui'
import { driverRequestSortFields } from '@awb/contracts'
import { CheckCircle, Pencil, Plus, Truck, Users, XCircle } from '@/ui/icons'
import { useDriverRequestPlants, useDriverRequests } from '@/hooks/driverRequest'
import { useAuth } from '@/hooks/auth'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'
import { PERMISSION } from '@/constant/PERMISSION'
import { hasPermission } from '@/utils/permission'
import { getErrorMessage } from '@/utils/errorHandler'
import { tableLayout } from '@/ui/loadingLayouts'
import { Table, type TableColumn } from '@/ui/Table'
import { PageHeader } from '@/ui/Card'
import { Toast, ToastStack } from '@/ui/Toast'
import { EmptyState } from '@/ui/EmptyState'
import ErrorState from '@/components/ErrorState'
import { ReviewDialog } from '../_components/ReviewDialog'
import { RequestDetailDialog } from '../_components/RequestDetailDialog'
import { StatusBadge } from '../_components/StatusBadge'
import type {
  DriverRequestItem,
  DriverRequestReviewAction,
  DriverRequestStatusOption,
} from '@/types/driverRequest'

const reviewerFilters: DriverRequestStatusOption[] = [
  {
    key: 'ALL',
    label: 'All',
  },
  {
    key: 'SUBMITTED',
    label: 'Pending review',
    statuses: 'SUBMITTED',
  },
  {
    key: 'APPROVED',
    label: 'Waiting for SAP',
    statuses: 'APPROVED',
  },
  {
    key: 'SENT_TO_PLANT',
    label: 'Sent to plant',
    statuses: 'SENT_TO_PLANT',
  },
  {
    key: 'REJECTED',
    label: 'Rejected',
    statuses: 'REJECTED',
  },
]

// Requesters only need to know whether a request is still in review, usable or needs fixing.
const requesterFilters: DriverRequestStatusOption[] = [
  {
    key: 'ALL',
    label: 'All',
  },
  {
    key: 'IN_REVIEW',
    label: 'In review',
    statuses: 'SUBMITTED,APPROVED',
  },
  {
    key: 'READY',
    label: 'Ready to use',
    statuses: 'SENT_TO_PLANT',
  },
  {
    key: 'NEEDS_REVISION',
    label: 'Needs revision',
    statuses: 'REJECTED',
  },
]

export default function ListDriverRequest() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const pagination = usePagination()
  const plants = useDriverRequestPlants()
  const [viewing, setViewing] = useState<string | null>(null)
  const [action, setAction] = useState<DriverRequestReviewAction | null>(null)

  const reviewer =
    user?.role === 'ADMIN' ||
    (user?.role === 'LOGISTIC' && hasPermission(user, PERMISSION.PREREG.APPROVE))

  const canCreate = hasPermission(user, PERMISSION.PREREG.CREATE)
  const kind = searchParams.get('kind') === 'vehicle' ? 'VEHICLE' : 'DRIVER'
  const filters = reviewer ? reviewerFilters : requesterFilters
  const rawStatus = searchParams.get('status') ?? (reviewer ? 'SUBMITTED' : 'ALL')
  const filter = filters.find((item) => item.key === rawStatus) ?? filters[0]!
  const status = filter.key

  const plant = searchParams.get('plant') ?? ''
  const notice = (location.state as { notice?: string } | null)?.notice

  const [toast, setToast] = useState<string | null>(notice ?? null)

  const { sortBy, sortDirection, sorting } = useSorting(
    driverRequestSortFields,
    'createdAt',
    'desc',
  )

  const requests = useDriverRequests({
    kind,
    status: filter.statuses,
    siteId: plant || undefined,
    page: pagination.page,
    limit: pagination.limit,
    sortBy,
    sortDirection,
  })

  const setFilter = (key: 'kind' | 'status' | 'plant', value: string) => {
    searchParams.set('page', '1')

    if (value) searchParams.set(key, value)
    else searchParams.delete(key)

    setSearchParams(searchParams)
  }

  const identity: TableColumn<DriverRequestItem> =
    kind === 'DRIVER'
      ? {
          key: 'driver',
          header: 'Driver',
          sortKey: 'driverName',
          skeleton: <SkeletonCell lines={2} width="75%" />,
          render: (item) => (
            <button type="button" className="text-left" onClick={() => setViewing(item.id)}>
              <p className="font-medium text-stone-900 hover:underline">{item.driverName}</p>
              <p className="font-mono text-xs text-stone-500">SIM {item.driverLicenseNumber}</p>
            </button>
          ),
        }
      : {
          key: 'vehicle',
          header: 'Vehicle',
          sortKey: 'vehiclePlateNumber',
          skeleton: <SkeletonCell width="7rem" />,
          render: (item) => (
            <button
              type="button"
              className="flex items-center gap-1.5 font-mono text-sm font-medium text-stone-900 hover:underline"
              onClick={() => setViewing(item.id)}
            >
              <Truck className="size-4 text-stone-400" />
              {item.vehiclePlateNumber}
            </button>
          ),
        }

  const columns: TableColumn<DriverRequestItem>[] = [
    identity,
    {
      key: 'plant',
      header: 'Plant',
      skeleton: <SkeletonCell width="6rem" />,
      render: (item) => <span className="text-sm text-stone-700">{item.plantName ?? '-'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      sortKey: 'createdAt',
      skeleton: <SkeletonCell width="6rem" />,
      render: (item) => (
        <span className="text-sm text-stone-600">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      skeleton: <SkeletonCell kind="badge" width="6rem" />,
      render: (item) => <StatusBadge status={item.status} requester={!reviewer} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      skeleton: <SkeletonCell kind="actions" count={2} />,
      render: (item) => {
        const label = item.driverName ?? item.vehiclePlateNumber ?? ''

        if (reviewer && item.status === 'SUBMITTED')
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                aria-label={`Reject ${label}`}
                onClick={() =>
                  setAction({
                    type: 'reject',
                    request: item,
                  })
                }
              >
                <XCircle className="size-4" />
                Reject
              </Button>
              <Button
                size="sm"
                aria-label={`Approve ${label}`}
                onClick={() =>
                  setAction({
                    type: 'approve',
                    request: item,
                  })
                }
              >
                <CheckCircle className="size-4" />
                Approve
              </Button>
            </div>
          )

        if (item.status === 'REJECTED' && item.submittedBy === user?.id)
          return (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/driver-requests/${item.id}/edit`)}
            >
              <Pencil className="size-3.5" />
              Revise
            </Button>
          )

        return (
          <Button variant="ghost" size="sm" onClick={() => setViewing(item.id)}>
            View
          </Button>
        )
      },
    },
  ]

  const items = requests.data?.items ?? []
  const noun = kind === 'DRIVER' ? 'driver' : 'vehicle'

  return (
    <div className="space-y-6">
      <ToastStack>
        {toast && <Toast message={toast} type="success" onDismiss={() => setToast(null)} />}
      </ToastStack>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Drivers & vehicles"
          subtitle={
            reviewer
              ? 'Review driver and vehicle requests. Approved ones go to the plant once SAP confirms them.'
              : 'Register drivers and vehicles. Once SAP confirms them, they can be used on registrations.'
          }
        />
        {canCreate && (
          <Button
            onClick={() =>
              navigate('/driver-requests/new' + (kind === 'VEHICLE' ? '?kind=vehicle' : ''))
            }
            className="shrink-0 gap-1.5"
          >
            <Plus className="size-4" />
            New {noun}
          </Button>
        )}
      </div>
      <div
        role="tablist"
        aria-label="Request type"
        className="flex gap-6 border-b border-stone-200"
      >
        {(
          [
            ['DRIVER', 'Drivers', Users],
            ['VEHICLE', 'Vehicles', Truck],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={kind === value}
            onClick={() => {
              searchParams.delete('sortBy')
              setFilter('kind', value === 'VEHICLE' ? 'vehicle' : '')
            }}
            className={`-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              kind === value
                ? 'border-brand-600 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Status filter">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={status === item.key}
              onClick={() => setFilter('status', item.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                status === item.key
                  ? 'bg-stone-900 text-stone-50'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {reviewer && (
          <div className="w-56">
            <Select
              aria-label="Plant filter"
              value={plant}
              disabled={plants.isLoading}
              onChange={(event) => setFilter('plant', event.target.value)}
            >
              <option value="">{plants.isLoading ? 'Loading plants…' : 'All plants'}</option>
              {plants.data?.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      {requests.isError ? (
        <ErrorState
          message={getErrorMessage(requests.error)}
          onRetry={() => void requests.refetch()}
        />
      ) : items.length === 0 && !requests.isPending && pagination.page === 1 ? (
        <EmptyState
          title={`No ${noun} requests`}
          icon={<Truck className="size-10 text-stone-300" />}
        >
          <p className="mt-1">
            {status === 'ALL' && canCreate
              ? `You have not registered any ${noun} yet.`
              : `No ${noun} requests match these filters.`}
          </p>
        </EmptyState>
      ) : (
        <Table
          columns={tableLayout(kind === 'DRIVER' ? 'requests' : 'vehicles', columns)}
          data={items}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => setViewing(item.id)}
          isLoading={requests.isPending}
          sorting={{
            ...sorting,
            isLoading: requests.isFetching,
          }}
          pagination={{
            ...pagination,
            total: requests.data?.total ?? 0,
            isLoading: requests.isFetching,
          }}
        />
      )}
      <RequestDetailDialog
        requestId={viewing}
        onClose={() => setViewing(null)}
        onReview={(next) => {
          setViewing(null)
          setAction(next)
        }}
      />
      <ReviewDialog action={action} onClose={() => setAction(null)} />
    </div>
  )
}
