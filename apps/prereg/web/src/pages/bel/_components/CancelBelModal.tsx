import { useState } from 'react'
import { Button, Field, Input } from '@awb/ui'
import { useCancelBel } from '@/hooks/bel'
import { Modal } from '@/ui'
import { getErrorMessage } from '@/utils/errorHandler'

export default function CancelBelModal({
  registration,
  onClose,
}: {
  registration: { id: string; number: string; version: number }
  onClose: () => void
}) {
  const cancelMutation = useCancelBel(registration.id)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    const trimmed = reason.trim()

    if (trimmed.length < 3) {
      setError('Enter a reason of at least 3 characters.')

      return
    }

    setError(null)

    try {
      await cancelMutation.mutateAsync({
        reason: trimmed,
        version: registration.version,
      })

      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Could not cancel BEL registration.'))
    }
  }

  return (
    <Modal title={`Cancel ${registration.number}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-stone-600">
          The registration is cancelled and its reserved PO quota becomes available again. This
          cannot be undone.
        </p>
        <Field label="Reason" required error={error}>
          <Input
            aria-label="Cancellation reason"
            placeholder="Enter reason (min 3 characters)..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Keep registration
          </Button>
          <Button
            variant="danger"
            isLoading={cancelMutation.isPending}
            onClick={() => void confirm()}
          >
            Cancel registration
          </Button>
        </div>
      </div>
    </Modal>
  )
}
