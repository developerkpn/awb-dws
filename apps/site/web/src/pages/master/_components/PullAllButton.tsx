import { useState } from 'react'
import type { MasterPullStatus } from '@awb/contracts'
import { usePullAllMasters } from '@/hooks/master'
import { Button } from '@/ui/Button'
import { CheckCircle, CloudSync } from '@/ui/icons'
import { Modal } from '@/ui/Modal'
import { getErrorMessage } from '@/utils/errorHandler'
import { MASTER_INFO, MASTER_ORDER } from '@/utils/master'
import type { PullAllResultProps } from '@/types/master'

function PullAllResult({ statuses, onClose }: PullAllResultProps) {
  const ordered = MASTER_ORDER.map((kind) => statuses.find((row) => row.kind === kind)).filter(
    (row): row is MasterPullStatus => !!row,
  )

  const pulled = ordered.filter((row) => row.sapAvailable)
  const pending = ordered.filter((row) => !row.sapAvailable)

  return (
    <Modal title="Pull from SAP" onClose={onClose}>
      <div className="space-y-5 text-sm">
        <section className="space-y-2">
          <h3 className="font-semibold text-stone-900">Pulled from SAP</h3>
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
            {pulled.map((row) => (
              <li key={row.kind} className="flex items-start justify-between gap-3 px-3 py-2">
                <span className="text-stone-800">{MASTER_INFO[row.kind].label}</span>
                {row.lastPullStatus === 'FAILED' ? (
                  <span className="text-right text-brand-700">
                    Failed{row.lastPullError ? `: ${row.lastPullError}` : ''}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-stone-600">
                    <CheckCircle className="size-4 text-emerald-600" />
                    {(row.lastPullRowCount ?? 0).toLocaleString('en-US')} rows
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {pending.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-semibold text-stone-900">SAP service in progress</h3>
            <p className="text-stone-600">
              The SAP services for these masters have not been created yet.
            </p>
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
              {pending.map((row) => (
                <li key={row.kind} className="px-3 py-2 text-stone-800">
                  {MASTER_INFO[row.kind].label}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose}>OK</Button>
        </div>
      </div>
    </Modal>
  )
}

export function PullAllButton() {
  const pull = usePullAllMasters()
  const [result, setResult] = useState<MasterPullStatus[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setError(null)

    try {
      setResult(await pull.mutateAsync())
    } catch (err) {
      setError(getErrorMessage(err, 'The pull from SAP failed.'))
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        isLoading={pull.isPending}
        onClick={() => void run()}
      >
        <CloudSync className="size-4" />
        Pull all from SAP
      </Button>
      {error && (
        <p role="alert" className="text-xs text-brand-700">
          {error}
        </p>
      )}
      {result && <PullAllResult statuses={result} onClose={() => setResult(null)} />}
    </div>
  )
}
