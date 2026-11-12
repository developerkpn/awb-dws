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
