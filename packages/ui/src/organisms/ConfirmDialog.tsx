import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '../atoms/Button'

export interface ConfirmOptions {
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
}
export function ConfirmDialog({
  options,
  onResolve,
}: {
  options: ConfirmOptions
  onResolve: (value: boolean) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current

    if (dialog && !dialog.open) dialog.showModal()

    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      className="ui-confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        onResolve(false)
      }}
    >
      <div className="ui-confirm-body">
        <span className="ui-dialog-eyebrow">Please confirm</span>
        <h2 id={titleId}>{options.title}</h2>
        <div id={descriptionId} className="ui-confirm-description">
          {options.description}
        </div>
      </div>
      <div className="ui-confirm-actions">
        <Button variant="secondary" autoFocus onClick={() => onResolve(false)}>
          {options.cancelLabel ?? 'Cancel'}
        </Button>
        <Button variant={options.variant ?? 'primary'} onClick={() => onResolve(true)}>
          {options.confirmLabel ?? 'Confirm'}
        </Button>
      </div>
    </dialog>
  )
}
