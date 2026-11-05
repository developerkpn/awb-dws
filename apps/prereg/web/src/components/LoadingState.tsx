export default function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="awb-loading" role="status">
      {message}
    </div>
  )
}
