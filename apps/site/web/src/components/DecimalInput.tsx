import { Controller } from 'react-hook-form'
import { QuantityInput } from '@awb/ui'
import type { DecimalInputProps } from '@/types/registration'

/** A registration weight or quantity, shown with thousands separators (12,345.5). */
export function DecimalInput({ form, name, ...props }: DecimalInputProps) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field: { value, onChange, ...field } }) => (
        <QuantityInput
          {...props}
          {...field}
          value={typeof value === 'string' ? value : ''}
          onValueChange={onChange}
          // The contract accepts up to 3 decimals.
          maxDecimals={3}
        />
      )}
    />
  )
}
