export interface TransporterOption {
  id: string
  code: string
  name: string
}

export interface DriverRequestItem {
  id: string
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SENT_TO_PLANT'
  driverName: string
  driverLicenseNumber: string
  vehiclePlateNumber: string
  submittedBy: string
  createdAt: string
  updatedAt: string
}

export interface DriverRequestDecision {
  id: string
  decision: string
  rejectionReason: string | null
  decidedAt: string
  decider: {
    id: string
    name: string
  }
}

export interface DriverRequestDetail {
  id: string
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SENT_TO_PLANT'
  submittedBy: string
  driverId?: string | null
  driverLicenseNumber: string
  driverName: string
  driverAddress: string
  driverBirthPlace: string
  driverBirthDate: string
  driverPhone: string
  driverCity?: string | null
  driverLicensePhotoUrl?: string | null
  driverPhotoUrl?: string | null
  vehicleId?: string | null
  vehiclePlateNumber: string
  transporterId?: string | null
  vehicleStnkPhotoUrl?: string | null
  decidedBy?: string | null
  decidedAt?: string | null
  decision?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
  transporter?: TransporterOption | null
  decisions: DriverRequestDecision[]
}

export interface DriverRequestFormData {
  driverLicenseNumber: string
  driverName: string
  driverAddress: string
  driverBirthPlace: string
  driverBirthDate: string
  driverPhone: string
  driverCity?: string
  driverLicensePhotoUrl?: string
  driverPhotoUrl?: string
  vehiclePlateNumber: string
  transporterId?: string
  vehicleStnkPhotoUrl?: string
}

export interface ListDriverRequestsQuery {
  limit?: number
  status?: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SENT_TO_PLANT'
  cursorId?: string
  cursorAt?: string
}

export interface DriverRequestsResponse {
  items: DriverRequestItem[]
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
