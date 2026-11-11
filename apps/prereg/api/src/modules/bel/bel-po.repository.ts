import type { BelPoItem } from '@awb/contracts'
import { quantity, quantityText } from '../../lib/quantity'
import gateway from '../sap/sap.repository'
import type { SapRow } from '../../types/sap'

// VEND_PO_QTYSet returns one row per PO item and movement type; QtyActual is per movement.
const MOVEMENT_SIGN: Record<string, bigint> = {
  '101': 1n,
  '102': -1n,
  '122': -1n,
  '123': 1n,
}

const GRAMS: Record<string, bigint> = {
  G: 1n,
  KG: 1_000n,
  TO: 1_000_000n,
  TON: 1_000_000n,
}

const field = (row: SapRow, name: string) => String(row[name] ?? '').trim()

function toUnit(value: bigint, from: string, to: string) {
  if (from === to) return value

  const source = GRAMS[from]
  const target = GRAMS[to]

  return source && target ? (value * source) / target : null
}

export function parsePoRows(rows: SapRow[], vendorCode: string): BelPoItem[] {
  const items = new Map<string, { first: SapRow; received: bigint } | null>()

  for (const row of rows) {
    if (field(row, 'Lifnr') !== vendorCode || !field(row, 'Materialno').startsWith('8')) continue

    const key = field(row, 'Ponum') + ':' + field(row, 'Poitem')
    const entry = items.get(key)

    if (entry === null) continue

    const amount = quantity(field(row, 'QtyActual') || '0')
    const sign = MOVEMENT_SIGN[field(row, 'Movty')]
    const orderUnit = field(row, 'UnitAwal').toUpperCase()
    const converted = toUnit(amount, field(row, 'UnitActual').toUpperCase() || orderUnit, orderUnit)

    // An unknown movement type or unit would make the remaining quota guesswork, so the item is left out.
    if ((amount !== 0n && !sign) || converted === null) {
      items.set(key, null)
      continue
    }

    items.set(key, {
      first: entry?.first ?? row,
      received: (entry?.received ?? 0n) + (sign ?? 0n) * converted,
    })
  }

  return [...items.values()].flatMap((entry) => {
    if (!entry) return []

    const row = entry.first
    const ordered = quantity(field(row, 'QtyAwal') || '0')
    const received = entry.received > 0n ? entry.received : 0n

    if (received >= ordered) return []

    return [
      {
        vendorCode,
        poNumber: field(row, 'Ponum'),
        poItem: field(row, 'Poitem'),
        material: field(row, 'Materialno'),
        description: field(row, 'Shorttxt') || 'Material ' + field(row, 'Materialno'),
        uom: field(row, 'UnitAwal').toUpperCase(),
        sapPlant: field(row, 'Plant'),
        orderedQuantity: quantityText(ordered),
        sapReceivedQuantity: quantityText(received),
        completed: false,
      },
    ]
  })
}

export default {
  async listByVendor(vendorCode: string): Promise<BelPoItem[]> {
    return parsePoRows(await gateway.vendorPurchaseOrders(vendorCode), vendorCode)
  },
}
