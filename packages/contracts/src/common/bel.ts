import { z } from 'zod'

export const belLineStatus = z.enum([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
])

export const belRequestStatus = z.enum([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PARTIAL',
  'CANCELLED',
  'EXPIRED',
])

export const belSortFields = ['createdAt', 'number', 'vendor', 'status'] as const

export const belTransportMode = z.enum(['V', 'T', 'R', 'P', 'L', 'E', 'A', 'W'])

export type BelLineStatus = z.infer<typeof belLineStatus>
export type BelRequestStatus = z.infer<typeof belRequestStatus>
export type BelSortField = (typeof belSortFields)[number]
export type BelTransportMode = z.infer<typeof belTransportMode>

export interface BelPoItem {
  vendorCode: string
  poType: string
  poNumber: string
  poItem: string
  material: string
  description: string
  uom: string
  sapPlant: string
  incoterm1: string
  orderedQuantity: string
  sapReceivedQuantity: string
  receivedUom: string
  sapShippedQuantity: string
  shippedUom: string
  completed: boolean
}

export interface BelPoItemChoice extends BelPoItem {
  id: string
  plantId: string
  plantName: string
  reservedQuantity: string
  availableQuantity: string
  sapRemainingQuantity: string
}

export interface BelRequestLine {
  id: string
  documentId: string
  poNumber: string
  poItem: string
  poType: string
  material: string
  description: string
  plantName: string
  sapPlant: string
  uom: string
  incoterm1: string
  orderedQuantity: string
  sapReceivedQuantity: string
  driverLicenseNumber: string | null
  driverName: string | null
  vehiclePlateNumber: string | null
  quantity: string
  loadingDate: string | null
  mediaTransport: string
  remark: string | null
  status: BelLineStatus
  stagedAt: string | null
  stageError: string | null
}

export interface BelRequestSummary {
  id: string
  number: string
  status: BelRequestStatus
  version: number
  vendor: {
    id: string
    name: string
    username: string
  }
  documents: string[]
  lineCount: number
  approvedCount: number
  createdAt: string
}

export interface BelRequestDetail extends BelRequestSummary {
  lines: BelRequestLine[]
  history: {
    id: string
    action: string
    reason: string | null
    actor: string | null
    createdAt: string
  }[]
}

export interface BelDraftInput {
  vendorId?: string
  version?: number
  lines: {
    id?: string
    documentId: string
    driverLicenseNumber?: string
    vehiclePlateNumber?: string
    quantity: string
    loadingDate?: string
    mediaTransport: BelTransportMode
    remark?: string
  }[]
}
