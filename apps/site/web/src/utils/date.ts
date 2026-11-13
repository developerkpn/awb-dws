export function formatDateTime(value: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function startOfDay(date: string) {
  return date ? new Date(`${date}T00:00:00`).toISOString() : undefined
}

export function endOfDay(date: string) {
  return date ? new Date(`${date}T23:59:59.999`).toISOString() : undefined
}

/** "45 min", "2 h 14 min", "1 d 3 h". */
export function formatDuration(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60_000))

  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `${hours} h ${minutes % 60} min`

  return `${Math.floor(hours / 24)} d ${hours % 24} h`
}

/** Time only for today, otherwise day and month too. */
export function formatClock(value: string, now = Date.now()) {
  const date = new Date(value)
  const today = new Date(now).toDateString() === date.toDateString()

  return date.toLocaleString('en-GB', {
    ...(today
      ? {}
      : {
          day: 'numeric',
          month: 'short',
        }),
    hour: '2-digit',
    minute: '2-digit',
  })
}
