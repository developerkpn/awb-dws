import { useFieldArray } from 'react-hook-form'
import { Button } from '@/ui/Button'
import { Field, Input } from '@/ui/Field'
import { Plus, Trash } from '@/ui/icons'
import type { GroupProps, RegistrationSectionProps } from '@/types/registration'
import { QualityRow } from './QualityRow'
import { Section } from './Section'

const FLAGS = [
  ['isDifferentEstate', 'Estate differs from the DO'],
  ['isReturn', 'Return'],
  ['needsLastWeighingCheck', 'Check on last weighing (remaining lot)'],
  ['needsContainerCheck', 'Container check needed'],
] as const

function Group({ title, children }: GroupProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{title}</h3>
      {children}
    </div>
  )
}

export function ExtrasSection({ form }: RegistrationSectionProps) {
  const { control, register, formState } = form
  const errors = formState.errors

  const containers = useFieldArray({
    control,
    name: 'containers',
  })

  const qualities = useFieldArray({
    control,
    name: 'qualities',
  })

  return (
    <Section
      id="extras"
      title="Extras (optional)"
      description="QC, containers, delivery note, seal, remarks and flags. Fill in when present."
      invalid={!!errors.containers || !!errors.qualities}
    >
      <div className="space-y-6">
        <Group title="Quality (QC)">
          {qualities.fields.map((field, index) => (
            <QualityRow
              key={field.id}
              form={form}
              index={index}
              onRemove={() => qualities.remove(index)}
            />
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              qualities.append({
                code: '',
                name: '',
                sapSpecification: '',
                estateValue: '',
                factoryValue: '',
                netDeduction: '',
              })
            }
          >
            <Plus className="size-4" />
            Add QC
          </Button>
        </Group>

        <Group title="Containers">
          {containers.fields.map((field, index) => (
            <div key={field.id} className="grid items-start gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <Input
                  aria-label={`Container number ${index + 1}`}
                  placeholder="Container number *"
                  className="uppercase"
                  aria-invalid={!!errors.containers?.[index]?.containerNumber}
                  {...register(`containers.${index}.containerNumber`)}
                />
                {errors.containers?.[index]?.containerNumber && (
                  <p className="mt-1 text-xs text-brand-700">
                    {errors.containers[index].containerNumber.message}
                  </p>
                )}
              </div>
              <Input
                aria-label={`Container seal ${index + 1}`}
                placeholder="Seal"
                {...register(`containers.${index}.sealNumber`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove container ${index + 1}`}
                onClick={() => containers.remove(index)}
              >
                <Trash className="size-4 text-rose-600" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              containers.append({
                containerNumber: '',
                sealNumber: '',
              })
            }
          >
            <Plus className="size-4" />
            Add container
          </Button>
        </Group>

        <Group title="Documents">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Delivery note">
              <Input {...register('deliveryNote')} />
            </Field>
            <Field label="Seal number">
              <Input {...register('sealNumber')} />
            </Field>
          </div>
        </Group>

        <Group title="Remarks">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="On the ticket">
              <Input {...register('ticketRemark')} />
            </Field>
            <Field label="On the report">
              <Input {...register('reportRemark')} />
            </Field>
            <Field label="Additional info">
              <Input {...register('additionalInfo')} />
            </Field>
          </div>
        </Group>

        <Group title="Flags">
          <div className="grid gap-2 sm:grid-cols-2">
            {FLAGS.map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" className="size-4 accent-brand-600" {...register(name)} />
                {label}
              </label>
            ))}
          </div>
        </Group>
      </div>
    </Section>
  )
}
