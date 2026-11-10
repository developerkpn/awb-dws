export interface SapDriver {
  licenseNumber: string
  name: string
  location: string | null
}

export interface SapVehicle {
  plateNumber: string
  location: string | null
}

export interface SapMasterImportResult {
  driverCount: number
  vehicleCount: number
}
