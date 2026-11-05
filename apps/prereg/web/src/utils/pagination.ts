export function getPage(value: string | null, maximum = 1000) {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 && page <= maximum ? page : 1
}
