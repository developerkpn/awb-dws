import type { BelPoItemChoice } from '@awb/contracts'
import { Badge } from '@/ui'
import { quantityUnits, unitsText } from '@/utils/quantity'

export default function BelDocumentDetails({
  choice,
  editableBonus = 0n,
}: {
  choice: BelPoItemChoice
  editableBonus?: bigint
}) {
  const effectiveAvailable = quantityUnits(choice.availableQuantity) + editableBonus
  const exhausted = effectiveAvailable <= 0n

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-stone-900">
            PO {choice.poNumber} / {choice.poItem}
          </span>
          <Badge variant="internal">{choice.poType}</Badge>
          <Badge variant="default">{choice.incoterm1 || 'FRC'}</Badge>
        </div>
        <span className="text-stone-600">
          Plant {choice.sapPlant} — {choice.plantName}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div>
          <p className="text-stone-500">Material</p>
          <p className="mt-0.5 font-medium text-stone-900">
            {choice.material} · {choice.description}
          </p>
        </div>
        <div>
          <p className="text-stone-500">PO ordered (Menge)</p>
          <p className="mt-0.5 font-mono font-medium text-stone-900">
            {unitsText(quantityUnits(choice.orderedQuantity))} {choice.uom}
          </p>
        </div>
        <div>
          <p className="text-stone-500">SAP GR (Erfmg)</p>
          <p className="mt-0.5 font-mono font-medium text-stone-900">
            {unitsText(quantityUnits(choice.sapReceivedQuantity))} {choice.receivedUom}
          </p>
        </div>
        <div>
          <p className="text-stone-500">Reserved in web</p>
          <p className="mt-0.5 font-mono font-medium text-stone-900">
            {unitsText(quantityUnits(choice.reservedQuantity))} {choice.uom}
          </p>
        </div>
        <div>
          <p className="text-stone-500">Remaining PO quota</p>
          <p
            className={`mt-0.5 font-mono font-semibold ${exhausted ? 'text-rose-700' : 'text-emerald-700'}`}
          >
            {unitsText(effectiveAvailable > 0n ? effectiveAvailable : 0n)} {choice.uom}
          </p>
        </div>
      </div>
    </div>
  )
}
