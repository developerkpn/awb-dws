import type { RegistrationCellProps } from '@/types/registration'

const kg = (value: string) =>
  Number(value).toLocaleString('en-US', {
    maximumFractionDigits: 3,
  })

export function LoadCell({ row }: RegistrationCellProps) {
  const [first, ...rest] = row.dos

  if (!first) return <span className="text-stone-400">—</span>

  return (
    <div className="min-w-0">
      <p className="flex items-start gap-1.5">
        <span className="mt-px shrink-0 rounded bg-stone-100 px-1.5 py-px text-[11px] font-semibold text-stone-700">
          {first.transactionCode}
        </span>
        <span className="line-clamp-1 font-medium text-stone-900">
          {first.commodityName || first.commodityCode || 'No commodity'}
        </span>
      </p>
      <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">
        {[first.doNumber, first.relationName].filter(Boolean).join(' · ')}
        {rest.length > 0 && ` · +${rest.length} DO`}
      </p>
      {row.otherPartyNet && (
        <p className="mt-0.5 text-xs text-stone-500">Ticket net {kg(row.otherPartyNet)} kg</p>
      )}
    </div>
  )
}
