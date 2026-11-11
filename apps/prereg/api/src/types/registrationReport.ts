import type { RegistrationReportType } from '@awb/contracts'
import type { z } from 'zod'
import type {
  reportExportQuery,
  reportListQuery,
} from '../modules/registration-report/registration-report.schema'

export type ReportListQuery = z.infer<typeof reportListQuery>

export type ReportExportQuery = z.infer<typeof reportExportQuery>

export type ReportScope = {
  allowedTypes: readonly RegistrationReportType[]
  partnerId?: string
  plantIds?: string[]
  isInternal: boolean
}

export type StoredReportRow = {
  id: string
  registrationId: string
  registrationNumber: string
  type: RegistrationReportType
  documentNumber: string
  documentItem: string | null
  stoNumber: string | null
  partnerId: string
  partnerCode: string
  partnerName: string
  plantId: string
  plantCode: string
  sapPlantCode: string | null
  plantName: string
  loadingNoteNumber: string | null
  requestedAt: Date
  loadingDate: Date | null
  driverLicenseNumber: string | null
  driverName: string | null
  vehiclePlateNumber: string | null
  mediaTransport: string
  quantity: string
  uom: string
  status: string
}
