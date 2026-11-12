import { useWatch } from 'react-hook-form'
import { registrationCreateInput } from '@awb/contracts'
import { Button } from '@/ui/Button'
import { CheckCircle, Save } from '@/ui/icons'
import type { SectionId, SummaryPanelProps, SummaryRow } from '@/types/registration'
import { formatKg, sumDecimal } from './defaults'

const scrollTo = (section: SectionId) =>
  document.getElementById(`section-${section}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })

export function SummaryPanel({ form, submitted, isSaving, onSave, onCancel }: SummaryPanelProps) {
  const values = useWatch({ control: form.control })

  const {
    plateNumber: plate,
    driverName: driver,
    licenseNumber: license,
    dos,
    destinations,
    hasOtherPartyWeight: hasOtherParty,
    otherPartyGross: gross,
    otherPartyTare: tare,
  } = values

  const validation = registrationCreateInput.safeParse(values)
  const invalidFields = new Set(validation.error?.issues.map((issue) => issue.path[0]))

  for (const field of Object.keys(form.formState.errors)) invalidFields.add(field)

  const selectedDos = (dos ?? []).filter((item) => item.doNumber?.trim())
  const doCount = selectedDos.length
  const loadComplete = doCount > 0 && !invalidFields.has('dos')
  const destinationComplete = !!destinations?.length && !invalidFields.has('destinations')

  const weightInvalid = [...invalidFields].some(
    (field) => typeof field === 'string' && field.startsWith('otherParty'),
  )

  const quantity = sumDecimal(selectedDos.map((item) => item.quantityKg))
  const net = (Number(gross) || 0) - (Number(tare) || 0)

  const rows: SummaryRow[] = [
    {
      section: 'truck',
      label: 'Truck plate',
      value: plate?.toUpperCase() || 'Required',
      state: plate?.trim() && !invalidFields.has('plateNumber') ? 'done' : 'missing',
    },
    {
      section: 'truck',
      label: 'Driver',
      value: driver || license || 'Required',
      state:
        license?.trim() && !invalidFields.has('licenseNumber') && !invalidFields.has('driverName')
          ? 'done'
          : 'missing',
    },
    {
      section: 'load',
      label: 'Load',
      value: doCount
        ? `${doCount} DO${quantity > 0 ? ` · ${formatKg(quantity)} kg` : ''}${loadComplete ? '' : ' · incomplete'}`
        : 'At least 1 DO',
      state: loadComplete ? 'done' : 'missing',
    },
    {
      section: 'destination',
      label: 'Destination',
      value: destinations?.length
        ? destinations.map((item) => item.code?.toUpperCase() || 'Incomplete').join(', ')
        : 'At least 1 destination',
      state: destinationComplete ? 'done' : 'missing',
    },
    {
      section: 'otherParty',
      label: 'Other-party ticket',
      value:
        hasOtherParty === undefined
          ? 'Not answered'
          : hasOtherParty
            ? weightInvalid
              ? 'Yes · check ticket details'
              : `Yes · net ${formatKg(net)} kg`
            : 'None',
      state:
        hasOtherParty === undefined ||
        invalidFields.has('hasOtherPartyWeight') ||
        (hasOtherParty && weightInvalid)
          ? 'missing'
          : 'done',
    },
  ]

  const required = rows.filter((row) => !row.optional)
  const done = required.filter((row) => row.state === 'done').length

  return (
    <aside
      aria-label="Registration summary"
      className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5"
    >
      <div>
        <h2 className="text-base font-semibold text-stone-900">Summary</h2>
        <p className="mt-0.5 text-sm text-stone-500">
          {done} of {required.length} required items complete
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width]"
            style={{ width: `${(done / required.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.label}>
            <button
              type="button"
              onClick={() => scrollTo(row.section)}
              className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-stone-50"
            >
              {row.state === 'done' ? (
                <CheckCircle className="mt-0.5 size-4.5 text-emerald-600" />
              ) : (
                <span
                  aria-hidden="true"
                  className={`mt-0.5 size-4.5 shrink-0 rounded-full border-2 ${
                    row.state === 'missing' && submitted ? 'border-brand-600' : 'border-stone-300'
                  }`}
                />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-medium text-stone-800">{row.label}</span>
                <span
                  className={`block truncate text-xs ${
                    row.state === 'missing' && submitted ? 'text-brand-700' : 'text-stone-500'
                  }`}
                >
                  {row.value}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Button className="w-full" isLoading={isSaving} onClick={onSave}>
          <Save className="size-4" />
          Save registration
        </Button>
        <Button className="w-full" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <p className="text-center text-xs text-stone-500">
          The registration number is assigned when saved.
        </p>
      </div>
    </aside>
  )
}
