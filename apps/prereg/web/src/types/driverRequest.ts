import type { ReactNode } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import type { driverFormSchema, vehicleFormSchema } from '@/pages/driverRequest/_components/schema'
import type { DriverRequestSortField, SortDirection } from '@awb/contracts'

export type DriverRequestKind = 'DRIVER' | 'VEHICLE'

export type DriverRequestStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SENT_TO_PLANT'

export interface PlantOption {
  code: string
  name: string
}

export interface DriverRequestItem {
  id: string
  kind: DriverRequestKind
  status: DriverRequestStatus
  driverName: string | null
  driverLicenseNumber: string | null
  vehiclePlateNumber: string | null
  siteId: string | null
  plantName: string | null
  submittedBy: string
  createdAt: string
  updatedAt: string
}

export interface DriverRequestDecision {
  id: string
  decision: string
  rejectionReason: string | null
  note: string | null
  decidedAt: string
  decider: {
    id: string
    name: string
  }
}

export interface DriverRequestDetail extends DriverRequestItem {
  driverAddress: string | null
  driverAddress2: string | null
  driverAddress3: string | null
  driverBirthPlace: string | null
  driverBirthDate: string | null
  driverPhone: string | null
  driverCity: string | null
  driverLicensePhotoUrl: string | null
  driverPhotoUrl: string | null
  vehicleStnkPhotoUrl: string | null
  decidedAt: string | null
  rejectionReason: string | null
  submitter: {
    id: string
    name: string
    username: string
    email: string | null
  }
  decisions: DriverRequestDecision[]
}

export type DriverFormValues = z.infer<typeof driverFormSchema>

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>

export type DriverRequestFormData =
  (DriverFormValues & { kind: 'DRIVER' }) | (VehicleFormValues & { kind: 'VEHICLE' })

export interface ListDriverRequestsQuery {
  page?: number
  limit?: number
  sortBy?: DriverRequestSortField
  sortDirection?: SortDirection
  status?: string
  kind?: DriverRequestKind
  siteId?: string
  cursorId?: string
  cursorAt?: string
}

export interface DriverRequestsResponse {
  items: DriverRequestItem[]
  total: number
  page: number
  limit: number
  nextCursor: {
    cursorId: string
    cursorAt: string
  } | null
}

export interface UploadedDocument {
  id: string
  fileName: string
  mimeType: string
  fileSize: number
  category: string
  url: string
  createdAt: string
}

export interface DriverRequestFormProps {
  kind: DriverRequestKind
  request?: DriverRequestDetail
  isSubmitting: boolean
  error?: string
  onSubmit: (data: DriverRequestFormData) => Promise<void>
  onCancel: () => void
}

export interface UploadSlotProps {
  label: string
  category: 'sim' | 'driver' | 'stnk'
  currentUrl?: string
  onChange: (url: string) => void
  disabled: boolean
  onPending: (category: string, pending: boolean) => void
  required?: boolean
  error?: string
}

export interface DriverRequestStatusOption {
  key: string
  label: string
  statuses?: string
}

export interface StatusBadgeProps {
  status: DriverRequestStatus
  requester?: boolean
}

export type DriverRequestReviewAction =
  | {
      type: 'approve'
      request: DriverRequestItem
    }
  | {
      type: 'reject'
      request: DriverRequestItem
    }

export interface DriverRequestReviewDialogProps {
  action: DriverRequestReviewAction | null
  onClose: () => void
}

export interface DriverRequestDetailDialogProps {
  requestId: string | null
  onClose: () => void
  onReview: (action: DriverRequestReviewAction) => void
}

export interface PlantFieldProps {
  form: UseFormReturn<FieldValues>
  disabled: boolean
}

export type RequestFormShellProps = Pick<
  DriverRequestFormProps,
  'request' | 'error' | 'isSubmitting'
> & {
  kind: 'driver' | 'vehicle'
  uploading: boolean
  onCancel: () => void
  onSubmit: () => void
  children: ReactNode
}
