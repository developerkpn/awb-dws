import { useState } from 'react'
import { isSapNotAvailable, usePullMaster } from '@/hooks/master'
import { Button } from '@/ui/Button'
import { CloudSync } from '@/ui/icons'
import { Modal } from '@/ui/Modal'
import { getErrorMessage } from '@/utils/errorHandler'
import { MASTER_INFO } from '@/utils/master'
import type { PullButtonProps } from '@/types/master'

export function PullButton({ kind, size = 'sm' }: PullButtonProps) {
  const pull = usePullMaster()
  const [notAvailable, setNotAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const label = MASTER_INFO[kind].label

  const run = async () => {
    setError(null)

    try {
      await pull.mutateAsync(kind)
    } catch (err) {
      if (isSapNotAvailable(err)) setNotAvailable(true)
      else setError(getErrorMessage(err, 'The pull from SAP failed.'))
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size={size}
        isLoading={pull.isPending}
        onClick={() => void run()}
      >
        <CloudSync className="size-4" />
        Pull from SAP
      </Button>
      {error && (
        <p role="alert" className="text-xs text-brand-700">
          {error}
        </p>
      )}
      {notAvailable && (
        <Modal title="SAP service in progress" onClose={() => setNotAvailable(false)} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              The SAP service for <strong>{label.toLowerCase()}</strong> has not been created yet,
              so it cannot be pulled. Until it is, this data comes from the WB.NET backfill.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setNotAvailable(false)}>OK</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
