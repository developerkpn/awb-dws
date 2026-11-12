import { Input, type InputProps } from './Input'

/** Keeps digits and one decimal point, with at most `maxDecimals` decimals. */
export function parseQuantityInput(value: string, maxDecimals = 6) {
  const [whole = '', ...decimals] = value.replace(/[^\d.]/g, '').split('.')

  return decimals.length ? `${whole}.${decimals.join('').slice(0, maxDecimals)}` : whole
}

/** Groups thousands with commas: 12345.5 → 12,345.5 */
export function formatQuantityInput(value: string) {
  const [whole = '', decimals] = value.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return decimals === undefined ? grouped : `${grouped}.${decimals}`
}

export interface QuantityInputProps extends Omit<InputProps, 'value' | 'onChange' | 'inputMode'> {
  value: string
  onValueChange: (value: string) => void
  maxDecimals?: number
}

/** Number input that shows thousands separators but hands back the plain value. */
export function QuantityInput({ value, onValueChange, maxDecimals, ...props }: QuantityInputProps) {
  return (
    <Input
      {...props}
      inputMode="decimal"
      value={formatQuantityInput(value)}
      onChange={(event) => onValueChange(parseQuantityInput(event.target.value, maxDecimals))}
    />
  )
}
