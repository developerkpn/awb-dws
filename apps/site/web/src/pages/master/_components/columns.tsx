import { SkeletonCell } from '@awb/ui'
import type { MasterColumns } from '@/types/master'

const text = (value: string | null | undefined) => value || '—'
const yesNo = (value: boolean) => (value ? 'Yes' : '—')
const kg = (value: string | null) => (value ? `${Number(value).toLocaleString('en-US')} kg` : '—')
const cell = <SkeletonCell width="70%" />

const flag = (value: boolean, label: string) =>
  value ? (
    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
      {label}
    </span>
  ) : (
    '—'
  )

export const MASTER_COLUMNS: MasterColumns = {
  vehicle: [
    {
      key: 'plate',
      header: 'Plate',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.plateNumber}</span>,
    },
    {
      key: 'transporter',
      header: 'Transporter',
      skeleton: cell,
      render: (row) => text([row.transporterCode, row.transporterName].filter(Boolean).join(' · ')),
    },
    {
      key: 'tanker',
      header: 'Tanker',
      skeleton: cell,
      render: (row) => text(row.tankerNumber),
    },
    {
      key: 'tare',
      header: 'Tare range',
      skeleton: cell,
      render: (row) =>
        row.tareMinKg || row.tareMaxKg ? `${kg(row.tareMinKg)} – ${kg(row.tareMaxKg)}` : '—',
    },
    {
      key: 'blacklist',
      header: 'Blacklist',
      skeleton: cell,
      render: (row) => flag(row.isBlacklisted, 'Blacklisted'),
    },
  ],
  driver: [
    {
      key: 'license',
      header: 'Licence (SIM)',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.licenseNumber}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      skeleton: cell,
      render: (row) => row.name,
    },
    {
      key: 'phone',
      header: 'Phone',
      skeleton: cell,
      render: (row) => text(row.phone),
    },
    {
      key: 'truck',
      header: 'Truck',
      skeleton: cell,
      render: (row) => text(row.truckNumber),
    },
    {
      key: 'blacklist',
      header: 'Blacklist',
      skeleton: cell,
      render: (row) => flag(row.isBlacklisted, 'Blacklisted'),
    },
  ],
  transporter: [
    {
      key: 'code',
      header: 'Code',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      skeleton: cell,
      render: (row) => row.name,
    },
    {
      key: 'phone',
      header: 'Phone',
      skeleton: cell,
      render: (row) => text(row.phone),
    },
    {
      key: 'address',
      header: 'Address',
      skeleton: cell,
      render: (row) => <p className="max-w-72 truncate">{text(row.address)}</p>,
    },
    {
      key: 'blacklist',
      header: 'Blacklist',
      skeleton: cell,
      render: (row) => flag(row.isBlacklisted, 'Blacklisted'),
    },
  ],
  tanker: [
    {
      key: 'number',
      header: 'Tanker',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.number}</span>,
    },
    {
      key: 'truck',
      header: 'Truck',
      skeleton: cell,
      render: (row) => text(row.truckNumber),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      skeleton: cell,
      render: (row) => kg(row.capacityKg),
    },
  ],
  destination: [
    {
      key: 'code',
      header: 'Code',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      skeleton: cell,
      render: (row) => text(row.name),
    },
    {
      key: 'storage',
      header: 'Storage location',
      skeleton: cell,
      render: (row) => text(row.storageLocation),
    },
  ],
  contract: [
    {
      key: 'do',
      header: 'DO',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.doNumber}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      skeleton: cell,
      render: (row) => row.transactionCode,
    },
    {
      key: 'commodity',
      header: 'Commodity',
      skeleton: cell,
      render: (row) => text(row.commodityName ?? row.commodityCode),
    },
    {
      key: 'relation',
      header: 'Buyer/seller',
      skeleton: cell,
      render: (row) => text(row.relationName ?? row.relationCode),
    },
    {
      key: 'contract',
      header: 'Contract',
      skeleton: cell,
      render: (row) => text(row.contractNumber),
    },
    {
      key: 'pi',
      header: 'PI/SI',
      skeleton: cell,
      render: (row) => text(row.piNumber),
    },
    {
      key: 'qty',
      header: 'Quantity',
      skeleton: cell,
      render: (row) =>
        `${kg(row.quantityKg)}${row.tolerancePercent ? ` ± ${row.tolerancePercent}%` : ''}`,
    },
    {
      key: 'closed',
      header: 'Status',
      skeleton: cell,
      render: (row) => (row.isClosed ? 'Closed' : 'Open'),
    },
  ],
  transactionType: [
    {
      key: 'code',
      header: 'Code',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      skeleton: cell,
      render: (row) => row.name,
    },
    {
      key: 'direction',
      header: 'In/Out',
      skeleton: cell,
      render: (row) => (row.direction === 'I' ? 'In' : row.direction === 'O' ? 'Out' : '—'),
    },
    {
      key: 'return',
      header: 'Return',
      skeleton: cell,
      render: (row) => yesNo(row.isReturn),
    },
    {
      key: 'vessel',
      header: 'Vessel',
      skeleton: cell,
      render: (row) => yesNo(row.isVessel),
    },
    {
      key: 'note',
      header: 'Loading note required',
      skeleton: cell,
      render: (row) => yesNo(row.requiresLoadingNote),
    },
    {
      key: 'tanker',
      header: 'Tanker required',
      skeleton: cell,
      render: (row) => yesNo(row.requiresTanker),
    },
  ],
  commodity: [
    {
      key: 'code',
      header: 'Code',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      skeleton: cell,
      render: (row) => row.name,
    },
    {
      key: 'unit',
      header: 'Unit',
      skeleton: cell,
      render: (row) => text(row.unit),
    },
    {
      key: 'tolerance',
      header: 'Tolerance',
      skeleton: cell,
      render: (row) => (row.tolerancePercent ? `${row.tolerancePercent}%` : '—'),
    },
    {
      key: 'sap',
      header: 'SAP material',
      skeleton: cell,
      render: (row) => text(row.sapMaterialCode),
    },
  ],
  relation: [
    {
      key: 'code',
      header: 'Code',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      skeleton: cell,
      render: (row) => row.name,
    },
    {
      key: 'type',
      header: 'Type',
      skeleton: cell,
      render: (row) => (row.type === 'B' ? 'Buyer' : row.type === 'S' ? 'Seller' : '—'),
    },
    {
      key: 'city',
      header: 'City',
      skeleton: cell,
      render: (row) => text(row.city),
    },
    {
      key: 'blacklist',
      header: 'Blacklist',
      skeleton: cell,
      render: (row) => flag(row.isBlacklisted, 'Blacklisted'),
    },
  ],
  estate: [
    {
      key: 'code',
      header: 'Code',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      skeleton: cell,
      render: (row) => row.name,
    },
    {
      key: 'city',
      header: 'City',
      skeleton: cell,
      render: (row) => text(row.city),
    },
    {
      key: 'sap',
      header: 'SAP code',
      skeleton: cell,
      render: (row) => text(row.sapCode),
    },
  ],
  qualityItem: [
    {
      key: 'code',
      header: 'Code',
      skeleton: cell,
      render: (row) => <span className="font-semibold">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      skeleton: cell,
      render: (row) => row.name,
    },
    {
      key: 'sap',
      header: 'SAP code',
      skeleton: cell,
      render: (row) => text(row.sapCode),
    },
  ],
}
