import { useState } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'
import { Button } from '@/ui/Button'
import { Plus } from '@/ui/icons'
import type { RegistrationSectionProps } from '@/types/registration'
import { emptyDo, formatKg, sumDecimal } from './defaults'
import { DoCard } from './DoCard'
import { Section } from './Section'

export function LoadSection({ form }: RegistrationSectionProps) {
  const dos = useFieldArray({
    control: form.control,
    name: 'dos',
  })

  const values =
    useWatch({
      control: form.control,
      name: 'dos',
    }) ?? []

  const [expanded, setExpanded] = useState<number | null>(null)
  const error = form.formState.errors.dos?.message ?? form.formState.errors.dos?.root?.message
  const selectedDos = values.filter((value) => value.doNumber?.trim())
  const total = sumDecimal(selectedDos.map((value) => value.quantityKg))

  const add = () => {
    setExpanded(dos.fields.length)
    dos.append(emptyDo())
    form.clearErrors('dos')
  }

  const remove = (index: number) => {
    dos.remove(index)

    setExpanded((current) =>
      current === null || current === index ? null : current > index ? current - 1 : current,
    )
  }

  return (
    <Section
      id="load"
      step={2}
      title="Load"
      description="The DOs or contracts the truck carries. One truck can carry several DOs."
      invalid={!!form.formState.errors.dos}
      action={
        selectedDos.length > 0 ? (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            {selectedDos.length} DO{total > 0 ? ` · ${formatKg(total)} kg` : ''}
          </span>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {dos.fields.map((field, index) => (
          <DoCard
            key={field.id}
            form={form}
            index={index}
            expanded={expanded === index}
            onExpand={() => setExpanded(index)}
            onCollapse={() => setExpanded(null)}
            onRemove={() => remove(index)}
          />
        ))}

        {error && (
          <p role="alert" className="text-sm text-brand-700">
            {error}
          </p>
        )}

        <Button type="button" variant={dos.fields.length ? 'ghost' : 'secondary'} onClick={add}>
          <Plus className="size-4" />
          {dos.fields.length ? 'Add another DO' : 'Add DO'}
        </Button>
      </div>
    </Section>
  )
}
