import { useFieldArray } from 'react-hook-form'
import { DecimalInput } from '@/components/DecimalInput'
import { Button } from '@/ui/Button'
import { Input } from '@/ui/Field'
import { Plus, Trash } from '@/ui/icons'
import type { DeductionListProps } from '@/types/registration'

const COLUMNS = [
  {
    name: 'code',
    label: 'Code',
    required: true,
  },
  {
    name: 'name',
    label: 'Name',
  },
  {
    name: 'percent',
    label: '%',
  },
  {
    name: 'deductionKg',
    label: 'Deduction (kg)',
  },
  {
    name: 'unitQuantity',
    label: 'Unit qty',
  },
] as const

export function DeductionList({ form, doIndex }: DeductionListProps) {
  const deductions = useFieldArray({
    control: form.control,
    name: `dos.${doIndex}.deductions`,
  })

  const errors = form.formState.errors.dos?.[doIndex]?.deductions

  return (
    <div className="space-y-3">
      {deductions.fields.map((field, index) => (
        <div
          key={field.id}
          className="grid items-start gap-2 rounded-lg bg-stone-50 p-3 sm:grid-cols-[6rem_1fr_5rem_8rem_6rem_auto_auto]"
        >
          {COLUMNS.map((column) => (
            <div key={column.name}>
              {column.name === 'code' || column.name === 'name' ? (
                <Input
                  aria-label={`${column.label} deduction ${index + 1}`}
                  placeholder={column.label + (column.name === 'code' ? ' *' : '')}
                  aria-invalid={!!errors?.[index]?.[column.name]}
                  className={column.name === 'code' ? 'uppercase' : ''}
                  {...form.register(`dos.${doIndex}.deductions.${index}.${column.name}`)}
                />
              ) : (
                <DecimalInput
                  form={form}
                  name={`dos.${doIndex}.deductions.${index}.${column.name}`}
                  aria-label={`${column.label} deduction ${index + 1}`}
                  placeholder={column.label}
                  aria-invalid={!!errors?.[index]?.[column.name]}
                />
              )}
              {errors?.[index]?.[column.name] && (
                <p className="mt-1 text-xs text-brand-700">{errors[index][column.name]?.message}</p>
              )}
            </div>
          ))}
          <label className="flex h-10 items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              className="size-4 accent-brand-600"
              {...form.register(`dos.${doIndex}.deductions.${index}.isReturn`)}
            />
            Return
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Remove deduction ${index + 1}`}
            onClick={() => deductions.remove(index)}
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
          deductions.append({
            code: '',
            name: '',
            percent: '',
            deductionKg: '',
            unitQuantity: '',
            isReturn: false,
          })
        }
      >
        <Plus className="size-4" />
        Add deduction
      </Button>
    </div>
  )
}
