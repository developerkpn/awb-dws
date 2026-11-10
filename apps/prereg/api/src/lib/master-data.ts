export function licenseKey(value: string) {
  return value.trim().toUpperCase()
}

export function plateKey(value: string) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase()
}

export function driverAddress(lines: {
  driverAddress: string | null
  driverAddress2: string | null
  driverAddress3: string | null
}) {
  return [lines.driverAddress, lines.driverAddress2, lines.driverAddress3]
    .filter((line) => line?.trim())
    .join(', ')
}
