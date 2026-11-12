import { useFieldArray } from 'react-hook-form'
import LookupField from '@/components/LookupField'
import { X } from '@/ui/icons'
import type { RegistrationSectionProps } from '@/types/registration'
import { Section } from './Section'

export function DestinationSection({ form }: RegistrationSectionProps) {
  const destinations = useFieldArray({
    control: form.control,
    name: 'destinations',
  })

  const error = form.formState.errors.destinations?.message

  return (
    <Section
      id="destination"
      step={3}
      title="Destination in the plant"
      description="Where the truck unloads or loads. Can be more than one."
      invalid={!!error}
    >
      {destinations.fields.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2">
          {destinations.fields.map((field, index) => (
            <li
              key={field.id}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 py-1 pr-1 pl-3 text-sm"
            >
              <span className="font-semibold text-stone-900">{field.code}</span>
              {field.name && <span className="text-stone-600">{field.name}</span>}
              <button
                type="button"
                aria-label={`Remove destination ${field.code}`}
                onClick={() => destinations.remove(index)}
                className="flex size-6 items-center justify-center rounded-full text-stone-400 hover:bg-white hover:text-brand-700"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="max-w-md">
        <LookupField
          kind="destination"
          label="Add destination"
          value=""
          placeholder="Search a destination, e.g. REF"
          error={error}
          filter={(row) => !destinations.fields.some((field) => field.code === row.code)}
          toOption={(row) => ({
            value: row.code,
            label: row.code,
            description: row.name ?? undefined,
          })}
          onPick={(row) => {
            destinations.append({
              code: row.code,
              name: row.name ?? '',
            })

            form.clearErrors('destinations')
          }}
        />
      </div>
    </Section>
  )
}
