import { CustomError } from '@awb/server-core'

const scale = 1_000_000n

export function quantity(value: string): bigint {
  if (!/^-?\d{1,14}(?:\.\d{1,6})?$/.test(value.trim())) {
    throw new CustomError('Invalid quantity; use at most six decimal places', 422)
  }

  const negative = value.trim().startsWith('-')
  const [whole = '0', fraction = ''] = value.trim().replace(/^-/, '').split('.')
  const result = BigInt(whole) * scale + BigInt(fraction.padEnd(6, '0'))

  return negative ? -result : result
}

export function quantityText(value: bigint): string {
  const absolute = value < 0n ? -value : value
  const fraction = (absolute % scale).toString().padStart(6, '0').replace(/0+$/, '')

  return (value < 0n ? '-' : '') + (absolute / scale).toString() + (fraction ? '.' + fraction : '')
}

export function legacyPaymentAmount(value: string): bigint {
  const normalized = value.trim().replace(/[.,]/g, '')

  if (!normalized) return 0n

  if (!/^-?\d{1,24}$/.test(normalized)) throw new CustomError('Invalid SAP payment amount', 502)

  return BigInt(normalized)
}

export function businessDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join('-')
}
