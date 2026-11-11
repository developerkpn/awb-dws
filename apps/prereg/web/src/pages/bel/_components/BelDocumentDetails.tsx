import type { BelPoItemChoice } from '@awb/contracts'
import { quantityUnits, unitsText } from '@/utils/quantity'

export default function BelDocumentDetails({
  choice,
  allocated = 0n,
  editableBonus = 0n,
}: {
  choice: BelPoItemChoice
  allocated?: bigint
  editableBonus?: bigint
}) {
  const effectiveAvailable = quantityUnits(choice.availableQuantity) + editableBonus
  const remainingAfterAllocations = effectiveAvailable - allocated

  const fields = [
    ['PO number / item', `PO ${choice.poNumber} / ${choice.poItem}`],
    ['Material', choice.material],
    ['Description', choice.description],
    ['Ordered quantity', `${unitsText(quantityUnits(choice.orderedQuantity))} ${choice.uom}`],
    ['SAP GR quantity', `${unitsText(quantityUnits(choice.sapReceivedQuantity))} ${choice.uom}`],
    ['Reserved in web', `${unitsText(quantityUnits(choice.reservedQuantity))} ${choice.uom}`],
    [
      'Remaining PO quota',
      `${unitsText(effectiveAvailable > 0n ? effectiveAvailable : 0n)} ${choice.uom}`,
    ],
    ['Plant', `${choice.sapPlant} · ${choice.plantName}`],
  ]

  return (
    <div className="space-y-3 pt-2">
      <dl className="grid gap-4 text-sm sm:grid-cols-4">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-stone-500">{label}</dt>
            <dd className="mt-1 font-medium break-words text-stone-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p
        className={
          remainingAfterAllocations < 0n ? 'text-sm text-rose-700' : 'text-sm text-stone-600'
        }
      >
        Remaining PO quota after these allocations:{' '}
        <span className="font-semibold">
          {unitsText(remainingAfterAllocations)} {choice.uom}
        </span>
      </p>
    </div>
  )
}
