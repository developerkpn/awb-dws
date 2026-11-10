import type { ComponentProps } from 'react'
import type { Input } from '@awb/ui'

export interface QuantityInputProps extends Omit<
  ComponentProps<typeof Input>,
  'value' | 'onChange' | 'inputMode'
> {
  value: string
  onValueChange: (value: string) => void
}
