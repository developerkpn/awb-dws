import { z } from 'zod'

export const registrationReportTypes = ['JUL', 'BEL'] as const

export const registrationReportType = z.enum(registrationReportTypes)

export const registrationReportDateFields = ['request', 'loading'] as const

export const registrationReportDateField = z.enum(registrationReportDateFields)

export const registrationReportSortFields = [
  'registrationNumber',
  'type',
  'documentNumber',
  'partnerName',
  'plantName',
  'loadingNoteNumber',
  'requestedAt',
  'loadingDate',
  'driverName',
  'vehiclePlateNumber',
  'plannedQuantity',
  'status',
] as const

export const registrationReportStatuses = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PARTIAL',
  'CANCELLED',
  'EXPIRED',
  'COMPLETED',
  'SAP_PENDING',
  'SAP_RETRY',
  'SAP_UNKNOWN',
] as const

export const registrationReportStatus = z.enum(registrationReportStatuses)

export type RegistrationReportType = z.infer<typeof registrationReportType>
export type RegistrationReportDateField = z.infer<typeof registrationReportDateField>
export type RegistrationReportSortField = (typeof registrationReportSortFields)[number]
export type RegistrationReportStatus = z.infer<typeof registrationReportStatus>

export interface RegistrationReportRow {
  id: string
  registrationId: string
  registrationNumber: string
  type: RegistrationReportType
  documentNumber: string
  documentItem: string | null
  stoNumber: string | null
  partner: {
    id: string
    code: string
    name: string
  }
  plant: {
    id: string
    code: string
    sapPlantCode: string | null
    name: string
  }
  loadingNoteNumber: string | null
  requestedAt: string
  requestDate: string
  loadingDate: string | null
  driverLicenseNumber: string | null
  driverName: string | null
  vehiclePlateNumber: string | null
  mediaTransport: string
  plannedQuantity: string
  uom: string
  status: RegistrationReportStatus
}

export interface RegistrationReportList {
  items: RegistrationReportRow[]
  total: number
  page: number
  limit: number
}

export interface RegistrationReportOptions {
  plants: {
    id: string
    code: string
    sapPlantCode: string | null
    name: string
  }[]
  partners: {
    id: string
    code: string
    name: string
    type: RegistrationReportType
  }[]
}
