import type { BelTransportMode } from '@awb/contracts'
import type { BelStatusBadgeMap } from '@/types/bel'

export const BEL_STATUS_BADGE: BelStatusBadgeMap = {
  DRAFT: {
    label: 'Draft',
    variant: 'default',
  },
  SUBMITTED: {
    label: 'Submitted',
    variant: 'info',
  },
  APPROVED: {
    label: 'Approved',
    variant: 'active',
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'danger',
  },
  PARTIAL: {
    label: 'Partial',
    variant: 'warning',
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'inactive',
  },
  EXPIRED: {
    label: 'Expired',
    variant: 'inactive',
  },
}

export const TRANSPORT_OPTIONS: { value: BelTransportMode; label: string }[] = [
  {
    value: 'T',
    label: 'T - Truck',
  },
  {
    value: 'V',
    label: 'V - Vessel',
  },
  {
    value: 'R',
    label: 'R - Rail',
  },
  {
    value: 'P',
    label: 'P - Pipeline',
  },
  {
    value: 'L',
    label: 'L - Light vehicle',
  },
  {
    value: 'E',
    label: 'E - Express',
  },
  {
    value: 'A',
    label: 'A - Air',
  },
  {
    value: 'W',
    label: 'W - Waterway',
  },
]

export function transportLabel(code: string) {
  return TRANSPORT_OPTIONS.find((option) => option.value === code)?.label ?? code
}
