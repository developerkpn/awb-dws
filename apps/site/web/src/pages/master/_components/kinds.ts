import type { MasterKind } from '@awb/contracts'
import type { MasterKindInfo } from '@/types/master'

export const MASTER_INFO: Record<MasterKind, MasterKindInfo> = {
  contract: {
    label: 'DOs & contracts',
    description: 'DO register with commodity, buyer/seller and quality specs.',
  },
  vehicle: {
    label: 'Trucks',
    description: 'Plates with transporter, tanker and tare range.',
  },
  driver: {
    label: 'Drivers',
    description: 'Driver licences (SIM) and names.',
  },
  transporter: {
    label: 'Transporters',
    description: 'Transport companies.',
  },
  tanker: {
    label: 'Tankers',
    description: 'Tanker numbers and capacity.',
  },
  destination: {
    label: 'Destinations',
    description: 'Where trucks unload or load in the plant.',
  },
  transactionType: {
    label: 'Transaction types',
    description: 'BEL, JUL, LSM… and their rules.',
  },
  commodity: {
    label: 'Commodities',
    description: 'Materials with unit and tolerance.',
  },
  relation: {
    label: 'Buyers & sellers',
    description: 'Customers and vendors.',
  },
  estate: {
    label: 'Estates',
    description: 'Estates (kebun) that supply the plant.',
  },
  qualityItem: {
    label: 'QC items',
    description: 'Quality parameters such as FFA, M&I and DOBI.',
  },
}

export const MASTER_ORDER = Object.keys(MASTER_INFO) as MasterKind[]
