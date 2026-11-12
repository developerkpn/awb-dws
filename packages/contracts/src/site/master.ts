import { z } from 'zod'

/** Plant master data. Rows come from SAP (or the WB.NET backfill, which is SAP data) or from prereg. */
export const masterKinds = [
  'vehicle',
  'driver',
  'transporter',
  'tanker',
  'destination',
  'contract',
  'transactionType',
  'commodity',
  'relation',
  'estate',
  'qualityItem',
] as const
export const masterKind = z.enum(masterKinds)
export type MasterKind = z.infer<typeof masterKind>

/** Lookups only use SAP rows; PREREG rows are a fallback kept for offline mode later. */
export const masterSources = ['SAP', 'PREREG'] as const
export const masterSource = z.enum(masterSources)
export type MasterSource = z.infer<typeof masterSource>

export const masterListQuery = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
})
export type MasterListQuery = z.input<typeof masterListQuery>

export interface MasterPullStatus {
  kind: MasterKind
  /** False until SAP provides a service for this master; pulling then reports "not available". */
  sapAvailable: boolean
  rowCount: number
  lastPulledAt: string | null
  lastPullStatus: 'SUCCESS' | 'FAILED' | null
  lastPullError: string | null
  lastPullRowCount: number | null
  lastBackfilledAt: string | null
}

export interface VehicleMaster {
  plateNumber: string
  transporterCode: string | null
  transporterName: string | null
  tankerNumber: string | null
  tareMinKg: string | null
  tareMaxKg: string | null
  isBlacklisted: boolean
  pulledAt: string | null
}

export interface DriverMaster {
  licenseNumber: string
  name: string
  address: string | null
  phone: string | null
  truckNumber: string | null
  isBlacklisted: boolean
  pulledAt: string | null
}

export interface TransporterMaster {
  code: string
  name: string
  address: string | null
  phone: string | null
  isBlacklisted: boolean
  pulledAt: string | null
}

export interface TankerMaster {
  number: string
  truckNumber: string | null
  capacityKg: string | null
  pulledAt: string | null
}

export interface DestinationMaster {
  code: string
  name: string | null
  storageLocation: string | null
  pulledAt: string | null
}

export interface TransactionTypeMaster {
  code: string
  name: string
  direction: 'I' | 'O' | null
  isReturn: boolean
  isVessel: boolean
  requiresLoadingNote: boolean
  requiresTanker: boolean
  pulledAt: string | null
}

export interface CommodityMaster {
  code: string
  name: string
  unit: string | null
  tolerancePercent: string | null
  sapMaterialCode: string | null
  pulledAt: string | null
}

export interface RelationMaster {
  code: string
  name: string
  /** B = buyer (customer), S = seller (vendor), as in WB.NET. */
  type: 'B' | 'S' | null
  city: string | null
  isBlacklisted: boolean
  pulledAt: string | null
}

export interface EstateMaster {
  code: string
  name: string
  city: string | null
  sapCode: string | null
  pulledAt: string | null
}

export interface QualityItemMaster {
  code: string
  name: string
  sapCode: string | null
  pulledAt: string | null
}

export interface ContractQuality {
  sapCode: string
  value: string | null
}

export interface ContractMaster {
  doNumber: string
  doDate: string | null
  contractNumber: string | null
  transactionCode: string
  transactionName: string | null
  commodityCode: string | null
  commodityName: string | null
  relationCode: string | null
  relationName: string | null
  transporterCode: string | null
  estateCode: string | null
  estateName: string | null
  piNumber: string | null
  quantityKg: string | null
  tolerancePercent: string | null
  soNumber: string | null
  soItem: string | null
  stoNumber: string | null
  isClosed: boolean
  qualities: ContractQuality[]
  pulledAt: string | null
}

export interface MasterRowByKind {
  vehicle: VehicleMaster
  driver: DriverMaster
  transporter: TransporterMaster
  tanker: TankerMaster
  destination: DestinationMaster
  contract: ContractMaster
  transactionType: TransactionTypeMaster
  commodity: CommodityMaster
  relation: RelationMaster
  estate: EstateMaster
  qualityItem: QualityItemMaster
}

export interface MasterListResult<K extends MasterKind> {
  items: MasterRowByKind[K][]
  total: number
  status: MasterPullStatus
}
