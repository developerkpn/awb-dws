import { useEffect, type ReactNode } from 'react'
import { CheckCircle, XCircle } from '@/ui/icons'
import type { ToastType } from '@/types/ui'

export function Toast({
  message,
  type = 'success',
  onDismiss,
}: {
  message: string
  type?: ToastType
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)

    return () => clearTimeout(t)
  }, [onDismiss])

  const style =
    type === 'success'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : 'bg-brand-50 text-brand-800 ring-brand-200'

  const Icon = type === 'success' ? CheckCircle : XCircle

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ring-1 shadow-lg ${style}`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-1 rounded p-0.5 opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}

export function ToastStack({ children }: { children: ReactNode }) {
  return <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2 items-end">{children}</div>
}
