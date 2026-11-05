import { Button } from '@awb/ui'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section className="awb-card">
      <p role="alert" className="awb-error">
        {message}
      </p>
      {onRetry && <Button onClick={onRetry}>Retry</Button>}
    </section>
  )
}
