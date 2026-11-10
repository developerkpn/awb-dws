import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  FormError,
  Input,
  PageHeader,
  useConfirm,
} from '@awb/ui'
import { useJulAction, useJulConfiguration, useJulRequest } from '@/hooks/jul'
import { useAuth } from '@/hooks/auth'
import { hasPermission } from '@/utils/permission'
import { getErrorMessage } from '@/utils/errorHandler'
import ErrorState from '@/components/ErrorState'
import { ArrowLeft, Pencil, RefreshCw } from '@/ui/icons'
import { JulSkeleton } from '../_components/JulSkeleton'
import { JulReviewLine } from '../_components/JulReviewLine'
import type { ApprovalSelection } from '@/types/jul'

export default function ViewJul() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const query = useJulRequest(id)
  const config = useJulConfiguration()
  const action = useJulAction()
  const confirm = useConfirm()

  const [error, setError] = useState<string | null>(
    (location.state as { error?: string } | null)?.error ?? null,
  )

  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [selected, setSelected] = useState<Record<string, ApprovalSelection>>({})

  if (query.isPending || config.isPending) return <JulSkeleton view="detail" />

  if (query.isError || config.isError)
    return (
      <ErrorState
        message="Unable to load this JUL registration."
        onRetry={() => {
          void query.refetch()
          void config.refetch()
        }}
      />
    )

  const request = query.data
  const canEdit = hasPermission(user, 'prereg:update')
  const canReview = config.data.canReview
  const submitted = request.lines.filter((line) => ['SUBMITTED', 'SAP_RETRY'].includes(line.status))

  const approvals = Object.values(selected).filter((selection) =>
    submitted.some((line) => line.id === selection.id),
  )

  async function run(suffix: string, data: unknown) {
    setError(null)

    try {
      await action.mutateAsync({
        path: '/' + id + suffix,
        data,
      })

      setSelected({})
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setPassword('')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="JUL registration"
        subtitle={request.isMulti ? `${request.number} · Multi-DO trip` : request.number}
        action={
          <Button variant="ghost" onClick={() => navigate('/jul')}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        }
      />
      <Card>
        <CardBody>
          <div className="grid gap-5 sm:grid-cols-4">
            <div>
              <p className="text-xs text-stone-500">Customer / vendor</p>
              <p className="mt-1 font-medium">{request.customer.name}</p>
              <p className="text-sm text-stone-500">{request.customer.username}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Status</p>
              <p className="mt-1 font-medium">{request.status.replaceAll('_', ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Loading notes</p>
              <p className="mt-1 font-medium">
                {request.completedCount} / {request.lineCount} confirmed
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Created</p>
              <p className="mt-1">{new Date(request.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardBody>
      </Card>
      <fieldset disabled={action.isPending} className="space-y-6">
        {request.lines.map((line, index) => (
          <Card key={line.id}>
            <CardHeader>
              <h2 className="font-semibold text-stone-900">
                Allocation {index + 1} · {line.referenceDocument}
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                {line.description} · {line.plantName} · {line.variant.replaceAll('_', ' ')}
              </p>
            </CardHeader>
            <CardBody className="space-y-5">
              <dl className="grid gap-4 text-sm sm:grid-cols-3">
                {[
                  ['Quantity', `${line.quantity} ${line.uom}`],
                  ['Loading date', line.loadingDate ?? 'Not set'],
                  [
                    'Driver',
                    line.driverName
                      ? `${line.driverName} · ${line.driverLicenseNumber}`
                      : (line.driverLicenseNumber ?? 'Not set'),
                  ],
                  ['Vehicle', line.vehiclePlateNumber ?? 'Not set'],
                  ['Status', line.status.replaceAll('_', ' ')],
                  ['Loading note', line.loadingNoteNumber ?? 'Awaiting confirmation'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-stone-500">{label}</dt>
                    <dd className="mt-1 font-medium text-stone-900">{value}</dd>
                  </div>
                ))}
              </dl>
              {line.stoNumber && <p className="text-sm text-stone-600">STO {line.stoNumber}</p>}
              {line.remark && <p className="text-sm text-stone-600">{line.remark}</p>}
              {line.sapError && <FormError message={line.sapError} />}
              {line.status === 'SAP_RETRY' && (
                <p className="text-sm text-stone-500">
                  SAP could not process this allocation yet. Logistics can push it again once the
                  document is free; the quantity stays reserved until then.
                </p>
              )}
              {line.status === 'SAP_FAILED' && (
                <p className="text-sm text-stone-500">
                  This allocation was released. Create a new request after correcting the SAP error.
                </p>
              )}
              {canReview && ['SUBMITTED', 'SAP_RETRY'].includes(line.status) && (
                <JulReviewLine
                  line={line}
                  selected={selected[line.id]}
                  change={(selection) =>
                    setSelected((current) => {
                      const next = { ...current }

                      if (selection) next[line.id] = selection
                      else delete next[line.id]

                      return next
                    })
                  }
                />
              )}
            </CardBody>
          </Card>
        ))}
        {request.jobs
          .filter((job) => !['COMPLETED', 'FAILED'].includes(job.status))
          .map((job) => (
            <Card key={job.id}>
              <CardBody>
                <p className="font-medium">SAP processing · {job.status.replaceAll('_', ' ')}</p>
                <p className="mt-2 text-sm text-stone-500">
                  {job.error ?? 'Waiting for SAP staging to confirm a loading-note number.'}
                </p>
                {job.canResume && (
                  <Button
                    className="mt-4"
                    variant="secondary"
                    onClick={() =>
                      void run('/jobs/' + job.id + '/resume', {
                        sapPassword: password || undefined,
                      })
                    }
                  >
                    Resume staging
                  </Button>
                )}
              </CardBody>
            </Card>
          ))}
        {canReview && (submitted.length > 0 || request.jobs.some((job) => job.canResume)) && (
          <Field label="Your SAP password" hint="Used for this request only; never saved.">
            <Input
              type="password"
              value={password}
              autoComplete="off"
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
        )}
        <FormError message={error} />
        <div className="flex flex-wrap justify-end gap-3">
          {canEdit && request.status === 'DRAFT' && (
            <>
              <Button variant="secondary" onClick={() => navigate('/jul/' + id + '/edit')}>
                <Pencil className="size-4" />
                Edit draft
              </Button>
              <Button
                isLoading={action.isPending}
                onClick={() => void run('/submit', { version: request.version })}
              >
                Submit for review
              </Button>
            </>
          )}
          {(request.status === 'PROCESSING' ||
            request.lines.some((line) => line.status === 'SAP_RETRY')) && (
            <Button
              variant="secondary"
              isLoading={action.isPending}
              onClick={() => void run('/reconcile', {})}
            >
              <RefreshCw className="size-4" />
              Check SAP status
            </Button>
          )}
          {canReview && submitted.length > 0 && (
            <Button
              isLoading={action.isPending}
              disabled={
                (request.isMulti ? approvals.length !== submitted.length : !approvals.length) ||
                !password
              }
              onClick={async () => {
                if (
                  await confirm({
                    title: 'Create loading notes?',
                    description: `Approve ${approvals.length} allocation(s) and send them for loading-note creation.`,
                    confirmLabel: 'Approve and create',
                  })
                )
                  void run('/approve', {
                    version: request.version,
                    lines: approvals,
                    sapPassword: password || undefined,
                  })
              }}
            >
              Approve & create loading notes
            </Button>
          )}
        </div>
        {canEdit &&
          ['DRAFT', 'SUBMITTED', 'PARTIAL'].includes(request.status) &&
          request.lines.some((line) =>
            ['DRAFT', 'SUBMITTED', 'SAP_RETRY', 'SAP_FAILED'].includes(line.status),
          ) && (
            <Card>
              <CardBody>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-60 flex-1">
                    <Field label="Cancellation reason">
                      <Input
                        value={reason}
                        maxLength={500}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Why should the remaining allocations be cancelled?"
                      />
                    </Field>
                  </div>
                  <Button
                    variant="danger"
                    disabled={reason.trim().length < 3}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: 'Cancel remaining allocations?',
                          description: 'Unprocessed quantities will be released.',
                          confirmLabel: 'Cancel allocations',
                          variant: 'danger',
                        })
                      )
                        void run('/cancel', {
                          version: request.version,
                          reason,
                        })
                    }}
                  >
                    Cancel remaining
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
      </fieldset>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-stone-900">Activity</h2>
        </CardHeader>
        <CardBody>
          <ol className="space-y-4">
            {request.history.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-3 text-sm last:border-0"
              >
                <div>
                  <p>{entry.action.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {entry.actor ?? 'System'}
                    {entry.reason ? ` · ${entry.reason}` : ''}
                  </p>
                </div>
                <time className="text-xs text-stone-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  )
}
