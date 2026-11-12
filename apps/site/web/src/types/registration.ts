import type { ReactNode } from 'react'
import type { FieldPath, UseFormReturn } from 'react-hook-form'
import type { QuantityInputProps } from '@awb/ui'
import type {
  RegistrationCreateData,
  RegistrationCreateInput,
  RegistrationDoInput,
  RegistrationSortField,
  RegistrationStatus,
  SortDirection,
} from '@awb/contracts'

export interface RegistrationListParams {
  page: number
  limit: number
  search?: string
  from?: string
  to?: string
  status?: RegistrationStatus
  sortBy: RegistrationSortField
  sortDirection: SortDirection
}

export type RegistrationForm = UseFormReturn<
  RegistrationCreateInput,
  unknown,
  RegistrationCreateData
>

export interface DecimalInputProps extends Omit<
  QuantityInputProps,
  'value' | 'onValueChange' | 'name' | 'form' | 'maxDecimals'
> {
  form: RegistrationForm
  name: FieldPath<RegistrationCreateInput>
}

export type SectionId = 'truck' | 'load' | 'destination' | 'otherParty' | 'extras'

export interface RegistrationSectionProps {
  form: RegistrationForm
}

export interface SectionProps {
  id: SectionId
  step?: number
  title: string
  description?: string
  action?: ReactNode
  invalid?: boolean
  children: ReactNode
}

export interface ChoiceOption<T extends string> {
  value: T
  label: string
  description?: string
}

export interface ChoiceGroupProps<T extends string> {
  label: string
  value: T | undefined
  options: readonly ChoiceOption<T>[]
  onChange: (value: T) => void
  invalid?: boolean
}

export interface GroupProps {
  title: string
  children: ReactNode
}

export interface SummaryRow {
  section: SectionId
  label: string
  value: string
  state: 'done' | 'missing' | 'optional'
  optional?: boolean
}

export interface RevealProps {
  label: string
  open: boolean
  onOpen: () => void
  children: ReactNode
}

export interface DisclosureProps {
  title: string
  summary?: string
  defaultOpen?: boolean
  children: ReactNode
}

export interface DoCardProps extends RegistrationSectionProps {
  index: number
  expanded: boolean
  onExpand: () => void
  onCollapse: () => void
  onRemove: () => void
}

export type DoTextField = Exclude<keyof RegistrationDoInput, 'deductions'>

export interface QualityRowProps extends RegistrationSectionProps {
  index: number
  onRemove: () => void
}

export interface DeductionListProps extends RegistrationSectionProps {
  doIndex: number
}

export interface SummaryPanelProps extends RegistrationSectionProps {
  submitted: boolean
  isSaving: boolean
  onSave: () => void
  onCancel: () => void
}

export interface StatusTab {
  value: RegistrationStatus | 'ALL'
  label: string
  count: number | undefined
}
