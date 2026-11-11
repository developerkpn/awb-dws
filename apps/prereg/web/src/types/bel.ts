import type {
  BelPoItemChoice,
  BelRequestDetail,
  BelRequestLine,
  BelRequestStatus,
  BelRequestSummary,
  BelSortField,
  BelTransportMode,
} from '@awb/contracts'

export type BelVendorOption = {
  id: string
  name: string
  username: string
}

export type BelMasterDriver = {
  licenseNumber: string
  name: string
}

export type BelMasterVehicle = string

export type BelListParams = {
  page: number
  limit: number
  sortBy: BelSortField
  sortOrder: 'asc' | 'desc'
  search?: string
  status?: BelRequestStatus
}

export type BelListResult = {
  items: BelRequestSummary[]
  total: number
  page: number
  limit: number
}

export type BelLineDraft = {
  key: string
  documentId: string
  driverLicenseNumber: string
  vehiclePlateNumber: string
  quantity: string
  loadingDate: string
  mediaTransport: BelTransportMode
  remark: string
}

export type BelSavePayload = {
  vendorId?: string
  version?: number
  lines: {
    documentId: string
    driverLicenseNumber?: string
    vehiclePlateNumber?: string
    quantity: string
    loadingDate?: string
    mediaTransport: BelTransportMode
    remark?: string
  }[]
}

export type BelReasonPayload = {
  version?: number
  reason: string
}

export type BelApprovePayload = {
  version?: number
}

export type BelStatusBadgeMap = Record<
  BelRequestStatus,
  {
    label: string
    variant: 'default' | 'info' | 'active' | 'warning' | 'danger' | 'inactive'
  }
>

export type BelPoChoiceMap = Record<string, BelPoItemChoice>

export type BelLineRow = BelRequestLine

export type BelDetailData = BelRequestDetail
