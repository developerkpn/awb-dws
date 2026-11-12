import { Controller, useWatch } from 'react-hook-form'
import { DecimalInput } from '@/components/DecimalInput'
import { Field, Input } from '@/ui/Field'
import type { RegistrationSectionProps } from '@/types/registration'
import { ChoiceGroup } from './ChoiceGroup'
import { formatKg } from './defaults'
import { Section } from './Section'

const ANSWERS = [
  {
    value: 'yes',
    label: 'Yes',
    description: 'Enter the weights on it',
  },
  {
    value: 'no',
    label: 'No',
    description: 'No other-party weight',
  },
] as const

function toLocalInput(value: string | undefined) {
  if (!value) return ''

  const date = new Date(value)

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function OtherPartySection({ form }: RegistrationSectionProps) {
  const { control, register, formState } = form
  const errors = formState.errors

  const answer = useWatch({
    control,
    name: 'hasOtherPartyWeight',
  })

  const gross = useWatch({
    control,
    name: 'otherPartyGross',
  })

  const tare = useWatch({
    control,
    name: 'otherPartyTare',
  })

  const net = (Number(gross) || 0) - (Number(tare) || 0)

  return (
    <Section
      id="otherParty"
      step={4}
      title="Other-party weighbridge ticket"
      description="Does the truck carry a weighbridge ticket from an estate, supplier or another mill?"
      invalid={!!errors.hasOtherPartyWeight || !!errors.otherPartyGross || !!errors.otherPartyTare}
    >
      <Controller
        control={control}
        name="hasOtherPartyWeight"
        render={({ field }) => (
          <ChoiceGroup
            label="Other-party weighbridge ticket"
            value={field.value === undefined ? undefined : field.value ? 'yes' : 'no'}
            options={ANSWERS}
            invalid={!!errors.hasOtherPartyWeight}
            onChange={(value) => field.onChange(value === 'yes')}
          />
        )}
      />
      {errors.hasOtherPartyWeight && (
        <p role="alert" className="mt-2 text-sm text-brand-700">
          {errors.hasOtherPartyWeight.message}
        </p>
      )}

      {answer && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Gross (kg)" required error={errors.otherPartyGross?.message}>
            <DecimalInput form={form} name="otherPartyGross" />
          </Field>
          <Field label="Tare (kg)" error={errors.otherPartyTare?.message}>
            <DecimalInput form={form} name="otherPartyTare" />
          </Field>
          <div className="rounded-xl bg-stone-50 px-4 py-3">
            <p className="text-xs text-stone-500">Net</p>
            <p className="mt-1 text-xl font-semibold text-stone-900">{formatKg(net)} kg</p>
          </div>
          <Field label="Ticket number">
            <Input {...register('otherPartyReference')} />
          </Field>
          <Controller
            control={control}
            name="otherPartyWeighedAt"
            render={({ field }) => (
              <Field label="Weighed at">
                <Input
                  type="datetime-local"
                  value={toLocalInput(field.value)}
                  onBlur={field.onBlur}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value ? new Date(event.target.value).toISOString() : '',
                    )
                  }
                />
              </Field>
            )}
          />
        </div>
      )}
    </Section>
  )
}
