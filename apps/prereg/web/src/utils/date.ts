function jakartaDate(offsetDays: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const date = new Date(parts + 'T00:00:00Z')

  date.setUTCDate(date.getUTCDate() + offsetDays)

  return date.toISOString().slice(0, 10)
}

export function today() {
  return jakartaDate(0)
}

export function tomorrow() {
  return jakartaDate(1)
}
