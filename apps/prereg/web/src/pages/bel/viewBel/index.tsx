import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, useConfirm } from '@awb/ui'
import ErrorState from '@/components/ErrorState'
import { PERMISSION } from '@/constant/PERMISSION'
import { useAuth } from '@/hooks/auth'
import { useApproveBel, useBelDetail, useCancelBel, useRejectBel, useSubmitBel } from '@/hooks/bel'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Badge, Modal } from '@/ui'
import { ArrowLeft, CheckCircle, Pencil, XCircle } from '@/ui/icons'
import { getErrorMessage } from '@/utils/errorHandler'
import { hasPermission } from '@/utils/permission'
import { quantityUnits, unitsText } from '@/utils/quantity'
import { BelSkeleton } from '../_components/BelSkeleton'
import { BEL_STATUS_BADGE, transportLabel } from '../_components/belStatus'

export default function BelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { user } = useAuth()

  const detailQuery = useBelDetail(id)
  const submitMutation = useSubmitBel(id ?? '')
  const approveMutation = useApproveBel(id ?? '')
  const rejectMutation = useRejectBel(id ?? '')
  const cancelMutation = useCancelBel(id ?? '')

  const [reasonModal, setReasonModal] = useState<'reject' | 'cancel' | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  useDocumentTitle(detailQuery.data?.number ?? 'BEL detail')

  if (user?.role === 'CUSTOMER') {
    return <Navigate to="/forbidden" replace />
  }

  if (detailQuery.isLoading) {
    return <BelSkeleton view="detail" />
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="BEL registration" />
        <ErrorState
          message={getErrorMessage(detailQuery.error, 'Could not load BEL registration.')}
          onRetry={() => void detailQuery.refetch()}
        />
      </div>
    )
  }

  const detail = detailQuery.data
  const statusBadge = BEL_STATUS_BADGE[detail.status]
  const canUpdate = hasPermission(user, PERMISSION.PREREG.UPDATE)

  const canApprove =
    user?.role === 'ADMIN' ||
    (user?.role === 'LOGISTIC' && hasPermission(user, PERMISSION.PREREG.APPROVE))

  const handleSubmit = async () => {
    const ok = await confirm({
      title: `Submit ${detail.number}?`,
      description:
        'This locks the PO quota allocation and sends the BEL registration to Logistics for approval (no DP check required).',
      confirmLabel: 'Submit BEL',
      variant: 'primary',
    })

    if (!ok) return

    setActionError(null)

    try {
      await submitMutation.mutateAsync(detail.version)
    } catch (error) {
      setActionError(getErrorMessage(error, 'Could not submit BEL registration.'))
    }
  }

  const handleApprove = async () => {
    const ok = await confirm({
      title: `Approve ${detail.number}?`,
      description:
        'Approved BEL lines are written directly to Oracle staging (PREREG_BEL_SAP). No SAP password, DP check, or automatic loading note trigger is needed.',
      confirmLabel: 'Approve & stage',
      variant: 'primary',
    })

    if (!ok) return

    setActionError(null)

    try {
      await approveMutation.mutateAsync({
        version: detail.version,
      })
    } catch (error) {
      setActionError(getErrorMessage(error, 'Could not approve BEL registration.'))
    }
  }

  const handleReasonConfirm = async () => {
    const trimmed = reasonText.trim()

    if (trimmed.length < 3) {
      setActionError('Enter a reason of at least 3 characters.')

      return
    }

    setActionError(null)

    try {
      if (reasonModal === 'reject') {
        await rejectMutation.mutateAsync({
          reason: trimmed,
          version: detail.version,
        })
      } else {
        await cancelMutation.mutateAsync({
          reason: trimmed,
          version: detail.version,
        })
      }

      setReasonModal(null)
      setReasonText('')
    } catch (error) {
      setActionError(getErrorMessage(error, 'Action failed.'))
    }
  }

  const busy =
    submitMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    cancelMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader title={detail.number} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/bel"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="size-4" />
          Back to BEL list
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canUpdate && ['DRAFT', 'REJECTED'].includes(detail.status) && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<Pencil className="size-3.5" />}
                onClick={() => navigate(`/bel/${detail.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={busy}
                onClick={() => void handleSubmit()}
              >
                Submit
              </Button>
            </>
          )}

          {canApprove && detail.status === 'SUBMITTED' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle className="size-3.5" />}
                isLoading={busy}
                onClick={() => void handleApprove()}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="size-3.5" />}
                disabled={busy}
                onClick={() => {
                  setActionError(null)
                  setReasonText('')
                  setReasonModal('reject')
                }}
              >
                Reject
              </Button>
            </>
          )}

          {canUpdate && ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(detail.status) && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => {
                setActionError(null)
                setReasonText('')
                setReasonModal('cancel')
              }}
            >
              Cancel BEL
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {actionError}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader action={<Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>}>
            <div className="space-y-1">
              <h2 className="font-mono text-lg font-semibold text-stone-900">{detail.number}</h2>
              <p className="text-xs text-stone-500">
                Vendor {detail.vendor.name} ({detail.vendor.username}) · Version {detail.version}
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-stone-500">Workflow rules</p>
                <p className="mt-1 font-medium text-stone-900">
                  No DP check · No automatic SAP loading note
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Oracle staging target</p>
                <p className="mt-1 font-mono text-xs font-semibold text-stone-900">
                  PREREG_BEL_SAP ({detail.approvedCount}/{detail.lineCount} lines staged)
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Created at</p>
                <p className="mt-1 text-stone-800">
                  {new Date(detail.createdAt).toLocaleString('en-GB', {
                    timeZone: 'Asia/Jakarta',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-stone-900">PO allocation lines</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {detail.lines.map((line) => {
              const lineBadge = BEL_STATUS_BADGE[line.status]

              return (
                <div
                  key={line.id}
                  className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                    <span className="font-mono text-sm font-semibold text-stone-900">
                      PO {line.poNumber} / {line.poItem}
                    </span>
                    <Badge variant={lineBadge.variant}>{lineBadge.label}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-stone-500">Material & plant</p>
                      <p className="mt-0.5 font-medium text-stone-900">
                        {line.material} · {line.description}
                      </p>
                      <p className="text-stone-500">
                        {line.sapPlant} — {line.plantName}
                      </p>
                    </div>

                    <div>
                      <p className="text-stone-500">Allocated / PO qty</p>
                      <p className="mt-0.5 font-mono font-semibold text-stone-900">
                        {unitsText(quantityUnits(line.quantity))} {line.uom}
                      </p>
                      <p className="text-stone-500">
                        Ordered {unitsText(quantityUnits(line.orderedQuantity))} · GR{' '}
                        {unitsText(quantityUnits(line.sapReceivedQuantity))} {line.uom}
                      </p>
                    </div>

                    <div>
                      <p className="text-stone-500">Driver & vehicle</p>
                      <p className="mt-0.5 font-medium text-stone-900">
                        {line.driverName ?? '—'} ({line.driverLicenseNumber ?? '—'})
                      </p>
                      <p className="font-mono text-stone-600">{line.vehiclePlateNumber ?? '—'}</p>
                    </div>

                    <div>
                      <p className="text-stone-500">Schedule & staging</p>
                      <p className="mt-0.5 font-medium text-stone-900">
                        {line.loadingDate ?? '—'} · {transportLabel(line.mediaTransport)}
                      </p>
                      {line.stagedAt ? (
                        <p className="mt-0.5 font-medium text-emerald-700">
                          Staged to PREREG_BEL_SAP
                        </p>
                      ) : line.stageError ? (
                        <p className="mt-0.5 font-medium text-rose-700">{line.stageError}</p>
                      ) : (
                        <p className="text-stone-500">Pending approval staging</p>
                      )}
                    </div>
                  </div>

                  {line.remark && (
                    <p className="mt-2 border-t border-stone-200/70 pt-2 text-stone-600">
                      Remark: {line.remark}
                    </p>
                  )}
                </div>
              )
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-stone-900">Activity history</h2>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2.5 text-xs">
              {detail.history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-100 pb-2 last:border-b-0"
                >
                  <div>
                    <span className="font-semibold text-stone-900">{entry.action}</span>
                    {entry.actor && <span className="text-stone-600"> · {entry.actor}</span>}
                    {entry.reason && (
                      <p className="mt-0.5 text-stone-600">Reason: {entry.reason}</p>
                    )}
                  </div>
                  <span className="text-stone-500">
                    {new Date(entry.createdAt).toLocaleString('en-GB', {
                      timeZone: 'Asia/Jakarta',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {reasonModal && (
        <Modal
          title={reasonModal === 'reject' ? `Reject ${detail.number}` : `Cancel ${detail.number}`}
          onClose={() => setReasonModal(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              {reasonModal === 'reject'
                ? 'Rejecting releases reserved PO quota back to the pool so the vendor can revise and resubmit.'
                : 'Cancelling releases reserved PO quota and updates PREREG_BEL_SAP if lines were already staged.'}
            </p>
            <Field label="Reason" required>
              <Input
                aria-label="Action reason"
                placeholder="Enter reason (min 3 characters)..."
                value={reasonText}
                onChange={(event) => setReasonText(event.target.value)}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReasonModal(null)}>
                Close
              </Button>
              <Button variant="danger" isLoading={busy} onClick={() => void handleReasonConfirm()}>
                {reasonModal === 'reject' ? 'Confirm rejection' : 'Confirm cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
