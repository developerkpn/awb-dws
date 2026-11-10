import { Input } from '@awb/ui'
import type { QuantityInputProps } from '@/types/form'
import { formatQuantityInput, parseQuantityInput } from '@/utils/quantity'

export default function QuantityInput({ value, onValueChange, ...props }: QuantityInputProps) {
  return (
    <Input
      {...props}
      inputMode="decimal"
      value={formatQuantityInput(value)}
      onChange={(event) => onValueChange(parseQuantityInput(event.target.value))}
    />
  )
}
