import type { MasterKind, MasterPullStatus } from '@awb/contracts'
import {
  ArrowLeftRight,
  Building,
  FileText,
  Flask,
  Handshake,
  IdCard,
  MapPin,
  Package,
  Tanker,
  Trees,
  Truck,
} from '@/ui/icons'
import { formatDateTime } from '@/utils/date'
import type { MasterKindInfo } from '@/types/master'

export function pullSummary(status: MasterPullStatus | undefined) {
  if (!status) return ''

  if (!status.lastPulledAt) return 'Not pulled from SAP yet'

  return `Last pulled from SAP ${formatDateTime(status.lastPulledAt)}${status.lastPullStatus === 'FAILED' ? ' (failed)' : ''}`
}

export const MASTER_INFO: Record<MasterKind, MasterKindInfo> = {
  contract: {
    label: 'DOs & contracts',
    description: 'DO register with commodity, buyer/seller and quality specs.',
    icon: FileText,
  },
  vehicle: {
    label: 'Trucks',
    description: 'Plates with transporter, tanker and tare range.',
    icon: Truck,
  },
  driver: {
    label: 'Drivers',
    description: 'Driver licences (SIM) and names.',
    icon: IdCard,
  },
  transporter: {
    label: 'Transporters',
    description: 'Transport companies.',
    icon: Building,
  },
  tanker: {
    label: 'Tankers',
    description: 'Tanker numbers and capacity.',
    icon: Tanker,
  },
  destination: {
    label: 'Destinations',
    description: 'Where trucks unload or load in the plant.',
    icon: MapPin,
  },
  transactionType: {
    label: 'Transaction types',
    description: 'BEL, JUL, LSM… and their rules.',
    icon: ArrowLeftRight,
  },
  commodity: {
    label: 'Commodities',
    description: 'Materials with unit and tolerance.',
    icon: Package,
  },
  relation: {
    label: 'Buyers & sellers',
    description: 'Customers and vendors.',
    icon: Handshake,
  },
  estate: {
    label: 'Estates',
    description: 'Estates (kebun) that supply the plant.',
    icon: Trees,
  },
  qualityItem: {
    label: 'QC items',
    description: 'Quality parameters such as FFA, M&I and DOBI.',
    icon: Flask,
  },
}

export const MASTER_ORDER = Object.keys(MASTER_INFO) as MasterKind[]
