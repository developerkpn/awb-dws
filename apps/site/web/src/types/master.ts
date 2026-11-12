import type { ComboboxOption } from '@awb/ui'
import type { TableColumn } from '@awb/ui'
import type { MasterKind, MasterListQuery, MasterRowByKind } from '@awb/contracts'

export type MasterListParams = MasterListQuery

export interface LookupFieldProps<K extends MasterKind> {
  kind: K
  label: string
  /** The picked code; empty when nothing is picked. */
  value: string
  /** What the field shows for the picked value, e.g. "KB 1234 AB · BMS". */
  display?: string
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  toOption: (row: MasterRowByKind[K]) => ComboboxOption
  filter?: (row: MasterRowByKind[K]) => boolean
  onPick: (row: MasterRowByKind[K]) => void
  onClear?: () => void
}

export interface MasterKindInfo {
  label: string
  description: string
}

export interface PullButtonProps {
  kind: MasterKind
  size?: 'sm' | 'md'
}

export type MasterColumns = { [K in MasterKind]: TableColumn<MasterRowByKind[K]>[] }

export interface MasterTableProps<K extends MasterKind> {
  kind: K
}
