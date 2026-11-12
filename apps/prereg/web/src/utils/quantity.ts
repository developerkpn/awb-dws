import { formatQuantityInput } from '@awb/ui'

export { formatQuantityInput, parseQuantityInput } from '@awb/ui'

const scale = 1_000_000n

export function quantityUnits(value: string) {
  const negative = value.trim().startsWith('-')
  const [whole = '', decimals = ''] = value.replace(/[^\d.]/g, '').split('.')
  const units = BigInt(whole || '0') * scale + BigInt(decimals.padEnd(6, '0').slice(0, 6))

  return negative ? -units : units
}

export function unitsText(units: bigint) {
  const absolute = units < 0n ? -units : units
  const fraction = (absolute % scale).toString().padStart(6, '0').replace(/0+$/, '')
  const text = (absolute / scale).toString() + (fraction ? '.' + fraction : '')

  return (units < 0n ? '-' : '') + formatQuantityInput(text)
}
