import type { JulDocumentDetailsProps } from '@/types/jul'
import { today } from '@/utils/date'
import { formatQuantityInput, quantityUnits, unitsText } from '@/utils/quantity'

export function JulDocumentDetails({ document, allocated }: JulDocumentDetailsProps) {
  const quantity = (value: string) => `${formatQuantityInput(value)} ${document.uom}`

  const remaining =
    quantityUnits(document.availableQuantity) -
    allocated.reduce((sum, value) => sum + quantityUnits(value || '0'), 0n)

  const fields = [
    ['Material', document.material],
    ['Description', document.description],
    ['Contract quantity', quantity(document.contractQuantity)],
    ['O/S SAP quantity', quantity(document.sapOutstandingQuantity)],
    ['O/S web quantity', quantity(document.availableQuantity)],
    ['Holding quantity', quantity(document.heldQuantity)],
    ['Unit of measure', document.uom],
    ['Company', document.company],
    ['Plant', `${document.sapPlant} · ${document.plantName}`],
    ['Contract document', document.contractNumber],
    ['Incoterms', [document.incoterm1, document.incoterm2].filter(Boolean).join('-')],
    ['Request date', today()],
    ...(document.buyerReference
      ? [
          ['Reference DO', document.buyerReference],
          ['Buyer', document.buyerName ?? '-'],
        ]
      : []),
    ...(document.stoNumber
      ? [
          ['STO number', document.stoNumber],
          ['Trans. type', document.transportType ?? '-'],
        ]
      : []),
  ]

  return (
    <div className="space-y-3">
      <dl className="grid gap-4 text-sm sm:grid-cols-4">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-stone-500">{label}</dt>
            <dd className="mt-1 font-medium break-words text-stone-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className={remaining < 0n ? 'text-sm text-rose-700' : 'text-sm text-stone-600'}>
        Remaining web quantity after these allocations:{' '}
        <span className="font-semibold">
          {unitsText(remaining)} {document.uom}
        </span>
      </p>
    </div>
  )
}
