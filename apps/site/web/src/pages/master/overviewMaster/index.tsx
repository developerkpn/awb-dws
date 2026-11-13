import { Link } from 'react-router'
import ErrorState from '@/components/ErrorState'
import { useMasterStatuses } from '@/hooks/master'
import { PageHeader } from '@/ui/Card'
import { getErrorMessage } from '@/utils/errorHandler'
import { MASTER_INFO, MASTER_ORDER, pullSummary } from '@/utils/master'
import { PullAllButton } from '../_components/PullAllButton'

export default function OverviewMaster() {
  const statuses = useMasterStatuses()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data master"
        subtitle="Master data used by the registration form. It comes from SAP; open a master from the menu to see its rows."
        action={<PullAllButton />}
      />

      {statuses.isError ? (
        <ErrorState
          message={getErrorMessage(statuses.error, 'Unable to load the masters.')}
          onRetry={() => void statuses.refetch()}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MASTER_ORDER.map((kind) => {
            const status = statuses.data?.find((item) => item.kind === kind)

            return (
              <div
                key={kind}
                className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/masters/${kind}`}
                      className="font-semibold text-stone-900 hover:text-brand-700"
                    >
                      {MASTER_INFO[kind].label}
                    </Link>
                    <p className="mt-0.5 text-sm text-stone-500">{MASTER_INFO[kind].description}</p>
                  </div>
                  <span className="text-2xl font-semibold text-stone-900">
                    {status ? status.rowCount.toLocaleString('en-US') : '–'}
                  </span>
                </div>
                <div className="mt-auto space-y-1 text-xs text-stone-500">
                  {statuses.isPending ? (
                    <p>Loading…</p>
                  ) : status && !status.sapAvailable ? (
                    <p className="text-amber-700">SAP service in progress</p>
                  ) : (
                    <p>{pullSummary(status)}</p>
                  )}
                  {status?.lastPullStatus === 'FAILED' && status.lastPullError && (
                    <p className="text-brand-700">{status.lastPullError}</p>
                  )}
                </div>
                <Link
                  to={`/masters/${kind}`}
                  className="text-sm font-medium text-brand-700 hover:text-brand-800"
                >
                  View rows
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
