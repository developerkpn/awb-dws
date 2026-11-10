import { useState } from 'react'
import { Button, Skeleton } from '@awb/ui'
import { Modal } from '@/ui/Modal'
import { DocumentPreview } from '@/components/DocumentPreview'
import { useDriverRequest } from '@/hooks/driverRequest'
import { useAuth } from '@/hooks/auth'
import { PERMISSION } from '@/constant/PERMISSION'
import { hasPermission } from '@/utils/permission'
import { StatusBadge } from './StatusBadge'
import { getErrorMessage } from '@/utils/errorHandler'
import { CheckCircle, FileText, XCircle } from '@/ui/icons'
import type { DriverRequestDetailDialogProps } from '@/types/driverRequest'
import type { DocumentPreviewTarget } from '@/types/document'

const date = (value?: string | null) => (value ? new Date(value).toLocaleString() : '-')

function statusHint(status: string, reviewer: boolean, noun: string) {
  if (status === 'REJECTED') return 'See the reason below and submit a revision.'

  if (status === 'SENT_TO_PLANT')
    return reviewer
      ? 'Created in SAP and sent to the plant.'
      : `Registered in SAP. You can select this ${noun} on a registration.`

  if (status === 'APPROVED')
    return reviewer
      ? 'Approved. Waiting for SAP to create it.'
      : `Approved by Logistics. You can use this ${noun} once SAP has created it.`

  return reviewer ? 'Waiting for your review.' : 'Waiting for Logistics to review.'
}

export function RequestDetailDialog({
  requestId,
  onClose,
  onReview,
}: DriverRequestDetailDialogProps) {
  const detail = useDriverRequest(requestId ?? '', Boolean(requestId))
  const { user } = useAuth()

  const reviewer =
    user?.role === 'ADMIN' ||
    (user?.role === 'LOGISTIC' && hasPermission(user, PERMISSION.PREREG.APPROVE))

  const [preview, setPreview] = useState<DocumentPreviewTarget | null>(null)
  const [broken, setBroken] = useState<Record<string, boolean>>({})

  if (!requestId) return null

  if (preview) return <DocumentPreview document={preview} onClose={() => setPreview(null)} />

  const request = detail.data

  const address = request
    ? [request.driverAddress, request.driverAddress2, request.driverAddress3]
        .filter(Boolean)
        .join(', ')
    : ''

  const fields = !request
    ? []
    : request.kind === 'DRIVER'
      ? [
          ['Driver', request.driverName ?? '-'],
          ['License number', request.driverLicenseNumber ?? '-'],
          ['Phone', request.driverPhone ?? '-'],
          [
            'Birth place and date',
            `${request.driverBirthPlace ?? '-'}, ${request.driverBirthDate?.slice(0, 10) ?? '-'}`,
          ],
          ['Home city', request.driverCity ?? '-'],
          ['Address', address || '-'],
          ['Plant target', request.plantName ?? '-'],
          ['Requested by', `${request.submitter.name} · ${request.submitter.username}`],
          ['Submitted', date(request.createdAt)],
        ]
      : [
          ['Plate number', request.vehiclePlateNumber ?? '-'],
          ['Plant target', request.plantName ?? '-'],
          ['Requested by', `${request.submitter.name} · ${request.submitter.username}`],
          ['Submitted', date(request.createdAt)],
        ]

  const documents = request
    ? [
        ['License photo', request.driverLicensePhotoUrl],
        ['Driver photo', request.driverPhotoUrl],
        ['STNK photo', request.vehicleStnkPhotoUrl],
      ].filter((entry): entry is [string, string] => Boolean(entry[1]))
    : []

  const item = request
    ? {
        id: request.id,
        kind: request.kind,
        status: request.status,
        driverName: request.driverName,
        driverLicenseNumber: request.driverLicenseNumber,
        vehiclePlateNumber: request.vehiclePlateNumber,
        siteId: request.siteId,
        plantName: request.plantName,
        submittedBy: request.submittedBy,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }
    : null

  return (
    <Modal
      title={request?.kind === 'VEHICLE' ? 'Vehicle request' : 'Driver request'}
      onClose={onClose}
      size="lg"
    >
      {detail.isLoading && (
        <div className="space-y-3">
          <Skeleton
            style={{
              height: '1rem',
              width: '60%',
            }}
          />
          <Skeleton style={{ height: '8rem' }} />
        </div>
      )}
      {detail.isError && <p className="text-sm text-rose-700">{getErrorMessage(detail.error)}</p>}
      {request && item && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={request.status} requester={!reviewer} />
            <span className="text-sm text-stone-600">
              {statusHint(
                request.status,
                reviewer,
                request.kind === 'DRIVER' ? 'driver' : 'vehicle',
              )}
            </span>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-stone-500">{label}</dt>
                <dd className="mt-1 font-medium break-words text-stone-900">{value}</dd>
              </div>
            ))}
          </dl>
          {documents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Documents</h3>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {documents.map(([label, url]) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={`Preview ${label}`}
                    onClick={() =>
                      setPreview({
                        url,
                        label,
                      })
                    }
                    className="group overflow-hidden rounded-lg border border-stone-200 text-left transition-colors hover:border-stone-400"
                  >
                    <div className="flex h-28 items-center justify-center bg-stone-100">
                      {broken[url] ? (
                        <FileText className="size-8 text-stone-400" />
                      ) : (
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={() =>
                            setBroken((current) => ({
                              ...current,
                              [url]: true,
                            }))
                          }
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                      <span className="truncate font-medium text-stone-700">{label}</span>
                      <span className="shrink-0 text-stone-500 group-hover:text-stone-900">
                        View
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {request.decisions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Review history</h3>
              <ul className="mt-2 space-y-2">
                {request.decisions.map((decision) => (
                  <li key={decision.id} className="rounded-lg bg-stone-50 p-3 text-sm">
                    <p className="font-medium text-stone-900">
                      {decision.decision === 'APPROVED' ? 'Approved' : 'Rejected'} by{' '}
                      {decision.decider.name} · {date(decision.decidedAt)}
                    </p>
                    {(decision.rejectionReason || decision.note) && (
                      <p className="mt-1 text-stone-600">
                        {decision.rejectionReason ?? decision.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {reviewer && request.status === 'SUBMITTED' && (
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  onReview({
                    type: 'reject',
                    request: item,
                  })
                }
              >
                <XCircle className="size-4" />
                Reject
              </Button>
              <Button
                onClick={() =>
                  onReview({
                    type: 'approve',
                    request: item,
                  })
                }
              >
                <CheckCircle className="size-4" />
                Approve
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
