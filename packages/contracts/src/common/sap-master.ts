export const sapMasterImportStatuses = ['RUNNING', 'SUCCEEDED', 'FAILED'] as const

export type SapMasterImportStatus = (typeof sapMasterImportStatuses)[number]

export interface SapMasterImport {
  id: string
  status: SapMasterImportStatus
  driverCount: number
  vehicleCount: number
  error: string | null
  startedAt: string
  finishedAt: string | null
}

export interface SapMasterSummary {
  drivers: number
  vehicles: number
  latestImport: SapMasterImport | null
}

export interface SapMasterDriverOption {
  licenseNumber: string
  name: string
}
