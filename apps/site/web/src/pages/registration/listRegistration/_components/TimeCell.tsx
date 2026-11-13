import { formatClock, formatDuration } from '@/utils/date'
import type { RegistrationTimeCellProps } from '@/types/registration'

export function TimeCell({ row, now }: RegistrationTimeCellProps) {
  const arrived = new Date(row.registeredAt).getTime()

  if (row.status === 'CANCELLED') {
    return (
      <div>
        <p className="text-stone-500">Cancelled</p>
        <p className="mt-0.5 text-xs text-stone-500">In {formatClock(row.registeredAt, now)}</p>
      </div>
    )
  }

  if (row.status === 'COMPLETED' && row.checkedOutAt) {
    return (
      <div>
        <p className="text-stone-900">
          {formatDuration(new Date(row.checkedOutAt).getTime() - arrived)}
        </p>
        <p className="mt-0.5 text-xs text-stone-500">Out {formatClock(row.checkedOutAt, now)}</p>
      </div>
    )
  }

  return (
    <div>
      <p className="font-semibold text-stone-900 tabular-nums">{formatDuration(now - arrived)}</p>
      <p className="mt-0.5 text-xs text-stone-500">In {formatClock(row.registeredAt, now)}</p>
    </div>
  )
}
