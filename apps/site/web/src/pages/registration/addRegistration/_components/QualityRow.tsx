import { useWatch } from 'react-hook-form'
import LookupField from '@/components/LookupField'
import { Button } from '@/ui/Button'
import { Field, Input } from '@/ui/Field'
import { Trash } from '@/ui/icons'
import type { QualityRowProps } from '@/types/registration'

const VALUES = [
  ['sapSpecification', 'SAP spec'],
  ['estateValue', 'Estate value'],
  ['factoryValue', 'Mill value'],
  ['netDeduction', 'Net deduction'],
] as const

export function QualityRow({ form, index, onRemove }: QualityRowProps) {
  const row = useWatch({
    control: form.control,
    name: `qualities.${index}`,
  })

  const errors = form.formState.errors.qualities?.[index]

  return (
    <div className="@container space-y-4 rounded-lg bg-stone-50 p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="grid min-w-0 gap-3 @min-[28rem]:grid-cols-2">
          <LookupField
            kind="qualityItem"
            label="QC code"
            required
            value={row?.code ?? ''}
            error={errors?.code?.message}
            toOption={(item) => ({
              value: item.code,
              label: item.code,
              description: [item.name, item.sapCode && `SAP ${item.sapCode}`]
                .filter(Boolean)
                .join(' · '),
            })}
            onPick={(item) => {
              form.setValue(`qualities.${index}.code`, item.code, {
                shouldDirty: true,
                shouldValidate: true,
              })

              form.setValue(`qualities.${index}.name`, item.name, { shouldDirty: true })
            }}
          />
          <Field label="Name">
            <Input readOnly value={row?.name ?? ''} placeholder="—" />
          </Field>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-6"
          aria-label={`Remove QC ${index + 1}`}
          onClick={onRemove}
        >
          <Trash className="size-4 text-rose-600" />
        </Button>
      </div>
      <div className="grid gap-3 @min-[20rem]:grid-cols-2 @min-[40rem]:grid-cols-4">
        {VALUES.map(([name, label]) => (
          <Field key={name} label={label} error={errors?.[name]?.message}>
            <Input {...form.register(`qualities.${index}.${name}`)} />
          </Field>
        ))}
      </div>
    </div>
  )
}
