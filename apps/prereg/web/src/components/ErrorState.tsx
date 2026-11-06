import { AlertTriangle, RefreshCw } from '@/ui/icons'
import { Button } from '@/ui/Button'

export default function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertTriangle className="size-8 text-red-500" />
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="size-3.5" />}
          onClick={onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  )
}
