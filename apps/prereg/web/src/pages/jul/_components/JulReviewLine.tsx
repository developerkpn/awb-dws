import { useState } from 'react'
import { Button, Field, FormError, Input, Select, Skeleton } from '@awb/ui'
import { useJulApprovalChoices, useJulHold } from '@/hooks/jul'
import QuantityInput from '@/components/QuantityInput'
import type { JulReviewLineProps } from '@/types/jul'
import { getErrorMessage } from '@/utils/errorHandler'

export function JulReviewLine({ line, selected, change }: JulReviewLineProps) {
  const [held, setHeld] = useState('')
  const [reason, setReason] = useState('')
  const hold = useJulHold()
  const query = useJulApprovalChoices(line.documentId)

  if (query.isPending)
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton style={{ width: '7rem' }} />
            <Skeleton style={{ height: '2.5rem' }} />
          </div>
        ))}
      </div>
    )

  if (query.isError) return <FormError message={getErrorMessage(query.error)} />

  const choices = query.data

  const current = selected ?? {
    id: line.id,
    factoryStorage: choices.factoryStorage[0]?.code ?? '',
    otherStorage: choices.otherStorage[0]?.code ?? '',
    factoryValuation: choices.factoryValuation[0] ?? '',
    otherValuation: choices.otherValuation[0] ?? '',
    factoryBatch: choices.factoryBatch,
    otherBatch: choices.otherBatch,
  }

  return (
    <div className="space-y-4 border-t border-stone-200 pt-5">
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <p>{choices.paymentEligible ? 'Down payment eligible' : 'Down payment insufficient'}</p>
        <p>
          Available {choices.availableQuantity} {choices.uom}
        </p>
        <p>
          Reserved {choices.reservedQuantity} · Hold {choices.heldQuantity}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={Boolean(selected)}
          disabled={!choices.paymentEligible}
          onChange={(event) => change(event.target.checked ? current : undefined)}
        />
        Approve this allocation
      </label>
      <fieldset disabled={!selected} className="grid gap-4 sm:grid-cols-3">
        {(['factoryStorage', 'otherStorage'] as const).map((key) => (
          <Field key={key} label={key === 'factoryStorage' ? 'Factory storage' : 'Other storage'}>
            <Select
              value={current[key]}
              onChange={(event) =>
                change({
                  ...current,
                  [key]: event.target.value,
                })
              }
            >
              {choices[key].map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
        ))}
        {(['factoryValuation', 'otherValuation'] as const).map((key) => (
          <Field
            key={key}
            label={key === 'factoryValuation' ? 'Factory valuation' : 'Other valuation'}
          >
            <Select
              value={current[key]}
              onChange={(event) =>
                change({
                  ...current,
                  [key]: event.target.value,
                })
              }
            >
              {choices[key].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          </Field>
        ))}
        {(['factoryBatch', 'otherBatch'] as const).map((key) => (
          <Field key={key} label={key === 'factoryBatch' ? 'Factory batch' : 'Other batch'}>
            <Input
              value={current[key]}
              maxLength={40}
              onChange={(event) =>
                change({
                  ...current,
                  [key]: event.target.value,
                })
              }
            />
          </Field>
        ))}
      </fieldset>
      <details className="text-sm text-stone-600">
        <summary className="cursor-pointer">Adjust held quantity</summary>
        <div className="mt-4 grid items-end gap-3 sm:grid-cols-3">
          <Field label="New held quantity">
            <QuantityInput
              placeholder={choices.heldQuantity}
              value={held}
              onValueChange={setHeld}
            />
          </Field>
          <Field label="Hold reason">
            <Input
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          <Button
            variant="secondary"
            isLoading={hold.isPending}
            disabled={!held || reason.trim().length < 3}
            onClick={() =>
              hold.mutate({
                documentId: line.documentId,
                quantity: held,
                reason,
              })
            }
          >
            Update hold
          </Button>
        </div>
        <FormError message={hold.error ? getErrorMessage(hold.error) : null} />
      </details>
    </div>
  )
}
