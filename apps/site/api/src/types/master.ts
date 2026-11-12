import type { MasterKind, MasterRowByKind, masterListQuery } from '@awb/contracts'
import type { z } from 'zod'
import type repository from '../modules/master/master.repository'

export type MasterListFilter = z.output<typeof masterListQuery>
export type ListedMasters = Awaited<ReturnType<typeof repository.list>>

export type SapRow = Record<string, unknown>

export interface SapPaging {
  top: number
  skip: number
}

export interface MasterPage<K extends MasterKind> {
  items: MasterRowByKind[K][]
  total: number
}

export interface VehicleInput {
  plateNumber: string
  transporterCode?: string | null
  transporterName?: string | null
  tankerNumber?: string | null
  tareMinKg?: string | null
  tareMaxKg?: string | null
  isBlacklisted?: boolean
}

export interface DriverInput {
  licenseNumber: string
  name: string
  address?: string | null
  phone?: string | null
  birthPlace?: string | null
  birthDate?: Date | null
  truckNumber?: string | null
  isBlacklisted?: boolean
}

export interface TransporterInput {
  code: string
  name: string
  address?: string | null
  phone?: string | null
  sapCode?: string | null
  isBlacklisted?: boolean
}

export interface TankerInput {
  number: string
  truckNumber?: string | null
  capacityKg?: string | null
  checkMode?: string | null
  tolerancePercent?: string | null
  toleranceKg?: string | null
}

export interface DestinationInput {
  code: string
  name?: string | null
  storageLocation?: string | null
}

export interface ContractInput {
  doNumber: string
  doDate?: Date | null
  contractNumber?: string | null
  transactionCode: string
  commodityCode?: string | null
  relationCode?: string | null
  transporterCode?: string | null
  estateCode?: string | null
  piNumber?: string | null
  quantityKg?: string | null
  tolerancePercent?: string | null
  incoterm?: string | null
  soNumber?: string | null
  soItem?: string | null
  stoNumber?: string | null
  isClosed?: boolean
  closedAt?: Date | null
  qualities?: { sapCode: string; value: string | null }[]
}

export interface TransactionTypeInput {
  code: string
  name: string
  direction?: string | null
  isReturn?: boolean
  isVessel?: boolean
  requiresLoadingNote?: boolean
  requiresTanker?: boolean
}

export interface CommodityInput {
  code: string
  name: string
  unit?: string | null
  tolerancePercent?: string | null
  sapMaterialCode?: string | null
}

export interface RelationInput {
  code: string
  name: string
  type?: string | null
  city?: string | null
  isBlacklisted?: boolean
}

export interface EstateInput {
  code: string
  name: string
  city?: string | null
  sapCode?: string | null
}

export interface QualityItemInput {
  code: string
  name: string
  sapCode?: string | null
}

export interface MasterInputByKind {
  vehicle: VehicleInput
  driver: DriverInput
  transporter: TransporterInput
  tanker: TankerInput
  destination: DestinationInput
  contract: ContractInput
  transactionType: TransactionTypeInput
  commodity: CommodityInput
  relation: RelationInput
  estate: EstateInput
  qualityItem: QualityItemInput
}
