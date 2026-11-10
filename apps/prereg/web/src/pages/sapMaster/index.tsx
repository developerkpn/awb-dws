import { Button, Card, CardBody, CardHeader, FormError, PageHeader, Skeleton } from '@awb/ui'
import type { SapMasterImportStatus } from '@awb/contracts'
import { useSapMasterSummary, useStartSapMasterImport } from '@/hooks/sapMaster'
import { Badge } from '@/ui/Badge'
import { Download } from '@/ui/icons'
import ErrorState from '@/components/ErrorState'
import { getErrorMessage } from '@/utils/errorHandler'
import type { BadgeVariant } from '@/types/ui'

const statusBadge: Record<SapMasterImportStatus, BadgeVariant> = {
  RUNNING: 'info',
  SUCCEEDED: 'active',
  FAILED: 'danger',
}

const dateTime = (value: string | null) => (value ? new Date(value).toLocaleString() : '-')

export default function SapMaster() {
  const summary = useSapMasterSummary()
  const start = useStartSapMasterImport()
  const latest = summary.data?.latestImport
  const running = latest?.status === 'RUNNING'

  if (summary.isError)
    return (
      <ErrorState message={getErrorMessage(summary.error)} onRetry={() => void summary.refetch()} />
    )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="SAP drivers & trucks"
        subtitle="Download the drivers and trucks registered in SAP. Only these can be chosen on a registration."
        action={
          <Button
            isLoading={start.isPending}
            disabled={!summary.data || running}
            onClick={() => start.mutate()}
          >
            <Download className="size-4" />
            {running ? 'Downloading…' : 'Download from SAP'}
          </Button>
        }
      />
      {start.isError && <FormError message={getErrorMessage(start.error)} />}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-stone-900">Registered in SAP</h2>
        </CardHeader>
        <CardBody>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              ['Drivers', summary.data?.drivers],
              ['Trucks', summary.data?.vehicles],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-stone-500">{label}</dt>
                <dd className="mt-1 text-lg font-semibold text-stone-900">
                  {summary.isLoading ? (
                    <Skeleton
                      style={{
                        width: '5rem',
                        height: '1.25rem',
                      }}
                    />
                  ) : (
                    Number(value ?? 0).toLocaleString()
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-stone-500">
            Drivers and trucks found by an exact license or plate search are added here
            automatically.
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-stone-900">Last download</h2>
        </CardHeader>
        <CardBody>
          {summary.isLoading ? (
            <Skeleton style={{ height: '3rem' }} />
          ) : latest ? (
            <div className="space-y-3">
              <dl className="grid gap-4 text-sm sm:grid-cols-4">
                {[
                  ['Status', <Badge variant={statusBadge[latest.status]}>{latest.status}</Badge>],
                  ['Started', dateTime(latest.startedAt)],
                  ['Finished', dateTime(latest.finishedAt)],
                  [
                    'Received',
                    `${latest.driverCount.toLocaleString()} drivers · ${latest.vehicleCount.toLocaleString()} trucks`,
                  ],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-xs text-stone-500">{label}</dt>
                    <dd className="mt-1 font-medium text-stone-900">{value}</dd>
                  </div>
                ))}
              </dl>
              {latest.error && <FormError message={latest.error} />}
            </div>
          ) : (
            <p className="text-sm text-stone-500">No download has run yet.</p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
