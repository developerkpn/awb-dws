import { useState } from 'react'
import { Button, Field, FormError, Textarea } from '@awb/ui'
import { Modal } from '@/ui/Modal'
import { CheckCircle, XCircle } from '@/ui/icons'
import { useApproveDriverRequest, useRejectDriverRequest } from '@/hooks/driverRequest'
import { getErrorMessage } from '@/utils/errorHandler'
import type { DriverRequestReviewDialogProps } from '@/types/driverRequest'

export function ReviewDialog({ action, onClose }: DriverRequestReviewDialogProps) {
  const approve = useApproveDriverRequest()
  const reject = useRejectDriverRequest()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!action) return null

  const approving = action.type === 'approve'
  const pending = approve.isPending || reject.isPending
  const plant = action.request.plantName ?? 'the requested plant'

  const close = () => {
    if (pending) return

    setText('')
    setError(null)
    onClose()
  }

  const submit = async () => {
    if (!approving && !text.trim()) {
      setError('Enter a rejection reason.')

      return
    }

    try {
      if (approving)
        await approve.mutateAsync({
          id: action.request.id,
          note: text.trim() || undefined,
        })
      else
        await reject.mutateAsync({
          id: action.request.id,
          rejectionReason: text.trim(),
        })

      setText('')
      setError(null)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Modal title={approving ? 'Approve request' : 'Reject request'} onClose={close}>
      <div className="space-y-4">
        <p className="text-sm text-stone-600">
          {action.request.kind === 'DRIVER'
            ? `${action.request.driverName} · SIM ${action.request.driverLicenseNumber}`
            : `Vehicle ${action.request.vehiclePlateNumber}`}
        </p>
        {approving && (
          <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
            After approval the {action.request.kind === 'DRIVER' ? 'driver' : 'vehicle'} waits for
            SAP. It is sent to {plant} once SAP confirms it.
          </p>
        )}
        <Field
          label={approving ? 'Note for the requester' : 'Rejection reason'}
          required={!approving}
        >
          <Textarea
            rows={3}
            maxLength={500}
            value={text}
            placeholder={approving ? 'Optional' : 'Explain what needs to be corrected'}
            onChange={(event) => {
              setText(event.target.value)
              setError(null)
            }}
          />
        </Field>
        {error && <FormError message={error} />}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={approving ? 'primary' : 'secondary'}
            isLoading={pending}
            onClick={() => void submit()}
          >
            {approving ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
            {approving ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
