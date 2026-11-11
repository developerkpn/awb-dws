import { z } from 'zod'

export const julVariant = z.enum(['LCO', 'FRC_TO_LCO'])
export const julLineStatus = z.enum([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'SAP_PENDING',
  'SAP_UNKNOWN',
  'SAP_RETRY',
  'SAP_FAILED',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
])
export const julRequestStatus = z.enum([
  'DRAFT',
  'SUBMITTED',
  'PROCESSING',
  'COMPLETED',
  'PARTIAL',
  'CANCELLED',
  'EXPIRED',
])
export const julSortFields = ['createdAt', 'number', 'customer', 'status'] as const
export const julTransportMode = z.enum(['V', 'T', 'R', 'P', 'L', 'E', 'A', 'W'])
export type JulVariant = z.infer<typeof julVariant>
export type JulLineStatus = z.infer<typeof julLineStatus>
export type JulRequestStatus = z.infer<typeof julRequestStatus>
export type JulSortField = (typeof julSortFields)[number]

export interface JulDocument {
  referenceDocument: string
  contractNumber: string
  material: string
  description: string
  uom: string
  sapPlant: string
  company: string
  incoterm1: string
  incoterm2: string
  itemRule: string
  invoiceType: string
  invoiceToleranceUpper: string
  invoiceToleranceLower: string
  contractQuantity: string
  sapUsedQuantity: string
  deletedQuantity: string
  observedLoadingNotes: string[]
  paid: boolean
  unpaidAmount: string
  stoNumber: string | null
  transportType: string | null
  buyerReference: string | null
  buyerName: string | null
}

export interface JulDocumentChoice extends JulDocument {
  id: string
  plantId: string
  plantName: string
  heldQuantity: string
  reservedQuantity: string
  availableQuantity: string
  sapOutstandingQuantity: string
}

export interface JulRequestLine {
  id: string
  documentId: string
  referenceDocument: string
  contractNumber: string
  material: string
  description: string
  plantName: string
  sapPlant: string
  uom: string
  variant: JulVariant
  stoNumber: string | null
  driverLicenseNumber: string | null
  driverName: string | null
  vehiclePlateNumber: string | null
  quantity: string
  loadingDate: string | null
  mediaTransport: string
  remark: string | null
  status: JulLineStatus
  loadingNoteNumber: string | null
  sapError: string | null
  factoryStorage: string | null
  otherStorage: string | null
  factoryValuation: string | null
  otherValuation: string | null
  jobId: string | null
}

export interface JulRequestSummary {
  id: string
  number: string
  status: JulRequestStatus
  version: number
  customer: { id: string; name: string; username: string }
  documents: string[]
  lineCount: number
  completedCount: number
  createdAt: string
  isMulti: boolean
}

export interface JulRequestDetail extends JulRequestSummary {
  lines: JulRequestLine[]
  jobs: { id: string; status: string; error: string | null; canResume: boolean }[]
  history: {
    id: string
    action: string
    reason: string | null
    actor: string | null
    createdAt: string
  }[]
}

export interface JulDraftInput {
  customerId?: string
  isMulti?: boolean
  version?: number
  lines: {
    id?: string
    documentId: string
    variant: JulVariant
    stoNumber?: string
    driverLicenseNumber?: string
    vehiclePlateNumber?: string
    quantity: string
    loadingDate?: string
    mediaTransport: z.infer<typeof julTransportMode>
    remark?: string
  }[]
}

export interface JulApprovalChoices {
  paymentEligible: boolean
  availableQuantity: string
  reservedQuantity: string
  heldQuantity: string
  uom: string
  factoryStorage: { code: string; name: string }[]
  otherStorage: { code: string; name: string }[]
  factoryValuation: string[]
  otherValuation: string[]
  factoryBatch: string
  otherBatch: string
}
