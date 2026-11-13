import { useWatch } from 'react-hook-form'
import { useCardStatus } from '@/hooks/registration'
import { useDebounce } from '@/hooks/useDebounce'
import { Field, Input } from '@/ui/Field'
import { CheckCircle, Contactless } from '@/ui/icons'
import type { RegistrationSectionProps } from '@/types/registration'
import { Section } from './Section'

export function CardSection({ form }: RegistrationSectionProps) {
  const { control, formState, register, trigger } = form

  const card = useWatch({
    control,
    name: 'cardNumber',
  })

  const typed = useDebounce((card ?? '').trim().toUpperCase(), 300)
  const status = useCardStatus(typed)
  const checked = status.data?.cardNumber === typed ? status.data : undefined

  const heldBy = checked?.heldBy

  const error =
    formState.errors.cardNumber?.message ??
    (heldBy
      ? `This card is still with ${heldBy.number} (${heldBy.plateNumber}). Finish or cancel that registration first.`
      : undefined)

  return (
    <Section
      id="card"
      step={5}
      title="RFID card"
      description="The card the driver taps at every stage, from the weighbridge to the exit."
      invalid={!!error}
    >
      <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,22rem)_1fr]">
        <Field label="Card number" required error={error}>
          <Input
            autoComplete="off"
            spellCheck={false}
            placeholder="Tap the card"
            className="uppercase placeholder:normal-case"
            {...register('cardNumber')}
            onKeyDown={(event) => {
              // Desk readers type the number and then press Enter.
              if (event.key === 'Enter') {
                event.preventDefault()
                void trigger('cardNumber')
              }
            }}
          />
        </Field>
        <div className="flex items-center gap-2 pt-7 text-sm">
          {checked && !heldBy ? (
            <>
              <CheckCircle className="size-4.5 text-emerald-600" />
              <span className="text-stone-700">Card is free to use</span>
            </>
          ) : (
            !typed && (
              <>
                <Contactless className="size-5 text-stone-400" />
                <span className="text-stone-500">Waiting for a card</span>
              </>
            )
          )}
        </div>
      </div>
    </Section>
  )
}
