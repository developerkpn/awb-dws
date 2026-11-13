import { useWatch } from 'react-hook-form'
import { registrationDeductionInput, type ContractMaster } from '@awb/contracts'
import { DecimalInput } from '@/components/DecimalInput'
import LookupField from '@/components/LookupField'
import { useMasterList } from '@/hooks/master'
import { Button } from '@/ui/Button'
import { Field, Input } from '@/ui/Field'
import { Lock, Pencil, Trash } from '@/ui/icons'
import type { DoCardProps, DoTextField } from '@/types/registration'
import { DeductionList } from './DeductionList'
import { formatKg } from './defaults'
import { Disclosure } from './Disclosure'

const pick = {
  shouldDirty: true,
  shouldValidate: true,
} as const

export function DoCard({ form, index, expanded, onExpand, onCollapse, onRemove }: DoCardProps) {
  const { control, register, formState, getValues, setValue, trigger } = form

  const value = useWatch({
    control,
    name: `dos.${index}`,
  })

  const errors = formState.errors.dos?.[index]
  const doNumber = value?.doNumber ?? ''
  const code = value?.transactionCode?.toUpperCase() ?? ''

  const qualityItems = useMasterList('qualityItem', { limit: 100 }, expanded)

  const contract = useMasterList(
    'contract',
    {
      search: doNumber,
      limit: 5,
    },
    expanded && !!doNumber,
  )

  const picked = contract.data?.items.find((row) => row.doNumber === doNumber)

  const field = (
    name: DoTextField,
    label: string,
    options: { required?: boolean; decimal?: boolean } = {},
  ) => (
    <Field label={label} required={options.required} error={errors?.[name]?.message}>
      {options.decimal ? (
        <DecimalInput form={form} name={`dos.${index}.${name}`} />
      ) : (
        <Input {...register(`dos.${index}.${name}`)} />
      )}
    </Field>
  )

  const choose = (row: ContractMaster) => {
    const set = (name: DoTextField, next: string | null) =>
      setValue(`dos.${index}.${name}`, next ?? '', pick)

    set('doNumber', row.doNumber)
    set('transactionCode', row.transactionCode)
    set('transactionName', row.transactionName)
    set('commodityCode', row.commodityCode)
    set('commodityName', row.commodityName)
    set('contractNumber', row.contractNumber)
    set('relationCode', row.relationCode)
    set('relationName', row.relationName)
    set('transporterCode', row.transporterCode)
    set('estate', row.estateName ?? row.estateCode)
    set('piNumber', row.piNumber)
    set('soItem', row.soItem)
    set('stoNumber', row.stoNumber)

    // The DO's quality specification becomes the QC rows, as in WB.NET.
    const existing = getValues('qualities') ?? []
    const items = qualityItems.data?.items ?? []

    const added = row.qualities
      .filter((quality) => !existing.some((qc) => qc.code === quality.sapCode))
      .map((quality) => {
        const item = items.find(
          (entry) => entry.sapCode === quality.sapCode || entry.code === quality.sapCode,
        )

        return {
          code: item?.code ?? quality.sapCode,
          name: item?.name ?? '',
          sapSpecification: quality.value ?? '',
          estateValue: '',
          factoryValue: '',
          netDeduction: '',
        }
      })

    if (added.length) setValue('qualities', [...existing, ...added], pick)
  }

  const done = async () => {
    if (await trigger(`dos.${index}`)) onCollapse()
  }

  const title = doNumber || `DO ${index + 1}`

  // One truck follows one flow, so every DO must share the transaction type of the others.
  const sharedType = (getValues('dos') ?? [])
    .find((line, position) => position !== index && line.transactionCode)
    ?.transactionCode?.toUpperCase()

  const deductionCount = (value?.deductions ?? []).filter(
    (deduction) => registrationDeductionInput.safeParse(deduction).success,
  ).length

  if (!expanded) {
    return (
      <div
        className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
          errors ? 'border-brand-200 bg-brand-50/40' : 'border-stone-200'
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-stone-900">{title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
            {code && (
              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-semibold text-stone-700">
                {code}
              </span>
            )}
            <span>{value?.commodityName || value?.commodityCode || 'No commodity'}</span>
            {value?.relationName && <span>· {value.relationName}</span>}
            {value?.quantityKg && <span>· {formatKg(Number(value.quantityKg))} kg</span>}
            {deductionCount > 0 && <span>· {deductionCount} deduction(s)</span>}
          </p>
          {errors && <p className="mt-1 text-xs text-brand-700">Some fields need fixing.</p>}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onExpand}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Remove ${title}`}
          onClick={onRemove}
        >
          <Trash className="size-4 text-rose-600" />
        </Button>
      </div>
    )
  }

  const locked: [string, string | undefined][] = [
    ['Transaction', [value?.transactionCode, value?.transactionName].filter(Boolean).join(' · ')],
    ['Commodity', [value?.commodityCode, value?.commodityName].filter(Boolean).join(' · ')],
    ['Contract', value?.contractNumber],
    ['Buyer/seller', [value?.relationCode, value?.relationName].filter(Boolean).join(' · ')],
    ['Transporter on the DO', value?.transporterCode],
    ['Estate', value?.estate],
    ['PI/SI', value?.piNumber],
    [
      'DO quantity',
      picked?.quantityKg
        ? `${formatKg(Number(picked.quantityKg))} kg${picked.tolerancePercent ? ` ± ${picked.tolerancePercent}%` : ''}`
        : undefined,
    ],
  ]

  return (
    <div className="space-y-5 rounded-xl border border-stone-300 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-stone-900">DO {index + 1}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Remove DO ${index + 1}`}
          onClick={onRemove}
        >
          <Trash className="size-4 text-rose-600" />
        </Button>
      </div>

      <LookupField
        kind="contract"
        label="DO number"
        required
        value={doNumber}
        placeholder={
          sharedType
            ? `Search a ${sharedType} DO, contract or PI number`
            : 'Search a DO, contract or PI number'
        }
        error={errors?.doNumber?.message ?? errors?.transactionCode?.message}
        filter={(row) => !row.isClosed && (!sharedType || row.transactionCode === sharedType)}
        toOption={(row) => ({
          value: row.doNumber,
          label: row.doNumber,
          description:
            [
              row.transactionCode,
              row.commodityName ?? row.commodityCode,
              row.relationName ?? row.relationCode,
            ]
              .filter(Boolean)
              .join(' · ') || undefined,
        })}
        onPick={choose}
      />

      {doNumber && (
        <dl className="grid gap-x-6 gap-y-3 rounded-lg bg-stone-50 p-4 text-sm sm:grid-cols-2">
          {locked.map(([label, text]) => (
            <div key={label}>
              <dt className="flex items-center gap-1 text-xs text-stone-500">
                <Lock className="size-3" />
                {label}
              </dt>
              <dd className="mt-0.5 font-medium text-stone-900">{text || '—'}</dd>
            </div>
          ))}
        </dl>
      )}

      {code === 'JUL' && (
        <div className="grid gap-4 rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200 sm:grid-cols-[1fr_8rem]">
          {field('loadingNoteNumber', 'SAP loading note', { required: true })}
          {field('loadingNoteItem', 'Item')}
          <p className="text-xs text-amber-800 sm:col-span-2">
            A sale (JUL) must carry an SAP loading note.
          </p>
        </div>
      )}

      <Disclosure title="Weights" summary="Mill net, other-party net, loading qty">
        <div className="grid gap-4 sm:grid-cols-2">
          {field('factoryNet', 'Mill net (kg)', { decimal: true })}
          {field('otherPartyNet', 'Other-party net (kg)', { decimal: true })}
          {field('loadingQuantity', 'Loading qty (kg)', { decimal: true })}
          {field('otherPartyLoadingQuantity', 'Other-party loading qty (kg)', { decimal: true })}
        </div>
      </Disclosure>

      <Disclosure title="SAP data" summary="SAP DO, SO, STO, quantity">
        <div className="grid gap-4 sm:grid-cols-2">
          {field('doSapNumber', 'SAP DO')}
          {field('doSapItem', 'SAP DO item')}
          {code !== 'JUL' && field('loadingNoteNumber', 'Loading note')}
          {code !== 'JUL' && field('loadingNoteItem', 'Loading note item')}
          {field('soItem', 'SO item')}
          {field('customerQq', 'Customer QQ')}
          {field('quantityKg', 'Quantity (kg)', { decimal: true })}
          <div />
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            {field('quantity', 'Quantity', { decimal: true })}
            {field('quantityUom', 'UoM')}
          </div>
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            {field('baseQuantity', 'Base quantity', { decimal: true })}
            {field('baseUom', 'UoM')}
          </div>
          {field('stoNumber', 'STO')}
          {field('doStoNumber', 'DO STO')}
        </div>
      </Disclosure>

      <Disclosure
        title="Deductions"
        summary={deductionCount ? `${deductionCount} deduction(s)` : 'None yet'}
        defaultOpen={deductionCount > 0}
      >
        <DeductionList form={form} doIndex={index} />
      </Disclosure>

      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={() => void done()}>
          Done
        </Button>
      </div>
    </div>
  )
}
