import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Plus, Pencil, Truck } from '@/ui/icons'
import { useDriverRequests } from '@/hooks/driverRequest'
import { Table, type TableColumn } from '@/ui/Table'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { PageHeader } from '@/ui/Card'
import { Toast, ToastStack } from '@/ui/Toast'
import ErrorState from '@/components/ErrorState'
import { EmptyState } from '@/ui/EmptyState'
import type { DriverRequestItem } from '@/types/driverRequest'

type StatusFilter = 'ALL' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export default function PreRegistrationList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentStatus = (searchParams.get('status') as StatusFilter) || 'ALL'

  const locationState = location.state as { notice?: string } | null
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    locationState?.notice ? { message: locationState.notice, type: 'success' } : null,
  )

  const requestsQuery = useDriverRequests({
    status: currentStatus === 'ALL' ? undefined : currentStatus,
    limit: 50,
  })

  const handleStatusChange = (status: StatusFilter) => {
    if (status === 'ALL') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', status)
    }
    setSearchParams(searchParams)
  }

  const columns: TableColumn<DriverRequestItem>[] = [
    {
      key: 'driver',
      header: 'Driver',
      render: (item) => (
        <div>
          <p className="font-medium text-stone-900">{item.driverName}</p>
          <p className="text-xs text-stone-500 font-mono">SIM: {item.driverLicenseNumber}</p>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (item) => (
        <div className="flex items-center gap-1.5 font-mono text-sm text-stone-800">
          <Truck className="size-4 text-stone-400" />
          <span>{item.vehiclePlateNumber}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Submitted Date',
      render: (item) => (
        <span className="text-sm text-stone-600">
          {new Date(item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        switch (item.status) {
          case 'APPROVED':
            return <Badge variant="active">Approved</Badge>
          case 'REJECTED':
            return <Badge variant="danger">Needs Revision</Badge>
          case 'SENT_TO_PLANT':
            return <Badge variant="info">Sent to Plant</Badge>
          case 'SUBMITTED':
          default:
            return <Badge variant="warning">Pending Review</Badge>
        }
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          {item.status === 'REJECTED' ? (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
              onClick={() => navigate(`/pre-registration/${item.id}/edit`)}
            >
              <Pencil className="size-3.5" />
              Revise
            </Button>
          ) : (
            <span className="text-xs text-stone-400">—</span>
          )}
        </div>
      ),
    },
  ]

  const items = requestsQuery.data?.items ?? []

  return (
    <div className="space-y-6">
      <ToastStack>
        {toast && (
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        )}
      </ToastStack>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Pre-registration"
          subtitle="Manage driver and vehicle registration requests for plant access."
        />
        <Button
          variant="primary"
          onClick={() => navigate('/pre-registration/new')}
          className="gap-1.5 shrink-0"
        >
          <Plus className="size-4" />
          New Request
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        {(
          [
            { key: 'ALL', label: 'All Status' },
            { key: 'SUBMITTED', label: 'Pending Review' },
            { key: 'APPROVED', label: 'Approved' },
            { key: 'REJECTED', label: 'Needs Revision' },
          ] as const
        ).map((tab) => {
          const isActive = currentStatus === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleStatusChange(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {requestsQuery.isError ? (
        <ErrorState
          message="Failed to load requests from server. Please try again."
          onRetry={() => requestsQuery.refetch()}
        />
      ) : items.length === 0 && !requestsQuery.isLoading ? (
        <EmptyState title="No Requests Found" icon={<Truck className="size-10 text-stone-300" />}>
          <p className="mt-1">
            {currentStatus !== 'ALL'
              ? 'No requests found matching this status filter.'
              : 'You have not submitted any driver or vehicle requests yet.'}
          </p>
          {currentStatus === 'ALL' && (
            <div className="mt-4">
              <Button variant="primary" onClick={() => navigate('/pre-registration/new')}>
                Create Request
              </Button>
            </div>
          )}
        </EmptyState>
      ) : (
        <Table
          columns={columns}
          data={items}
          keyExtractor={(item) => item.id}
          isLoading={requestsQuery.isLoading}
          pagination={{
            page: 1,
            limit: 50,
            total: items.length,
            onPageChange: () => {},
            onPageSizeChange: () => {},
          }}
        />
      )}
    </div>
  )
}
