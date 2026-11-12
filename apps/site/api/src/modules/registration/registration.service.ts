import type {
  RegistrationCounts,
  RegistrationCreateData,
  RegistrationCreated,
  RegistrationListItem,
  RegistrationListResult,
  RegistrationStatus,
} from '@awb/contracts'
import type { ListedRegistration, RegistrationListFilter } from '../../types/registration'
import { ValidationError } from '@awb/server-core'
import { plate } from '../master/master.mappers'
import masterService from '../master/master.service'
import repository from './registration.repository'

const iso = (value: Date | null) => (value ? value.toISOString() : null)

function present(row: ListedRegistration): RegistrationListItem {
  return {
    id: row.id,
    number: row.number,
    cardNumber: row.cardNumber,
    registeredAt: row.registeredAt.toISOString(),
    referenceNumber: row.referenceNumber,
    checkedOutBy: row.checkedOutBy?.name ?? null,
    checkedOutAt: iso(row.checkedOutAt),
    plateNumber: row.plateNumber,
    tankerNumber: row.tankerNumber,
    licenseNumber: row.licenseNumber,
    driverName: row.driverName,
    transporterCode: row.transporterCode,
    deliveryNote: row.deliveryNote,
    sealNumber: row.sealNumber,
    ticketRemark: row.ticketRemark,
    createdBy: row.createdBy.name,
    createdAt: row.createdAt.toISOString(),
    revisedBy: row.revisedBy?.name ?? null,
    revisedAt: iso(row.revisedAt),
    cancelledBy: row.cancelledBy?.name ?? null,
    cancelledAt: iso(row.cancelledAt),
    status: row.status as RegistrationStatus,
    dos: row.dos,
    destinations: row.destinations.map((destination) => destination.code),
  }
}

// Unique-key races on the running number and SQL Server deadlocks are safe to retry.
const retryable = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error.code === 'P2002' || error.code === 'P2034')

/**
 * The form is pick-only: every code must be an active SAP master row. Names, and the DO details,
 * are taken from the masters rather than from what the client sent.
 */
async function withMasters(data: RegistrationCreateData): Promise<RegistrationCreateData> {
  const plateNumber = plate(data.plateNumber) ?? ''
  const doNumbers = data.dos.map((line) => line.doNumber)

  const masters = await masterService.forRegistration({
    plateNumber,
    licenseNumber: data.licenseNumber || null,
    transporterCode: data.transporterCode || null,
    tankerNumber: data.tankerNumber || null,
    destinations: data.destinations.map((destination) => destination.code),
    doNumbers,
  })

  const errors: Record<string, string[]> = {}
  const fail = (field: string, message: string) => (errors[field] ??= []).push(message)

  if (!masters.vehicle) fail('plateNumber', 'Truck plate is not in the SAP truck master')

  if (data.licenseNumber && !masters.driver)
    fail('licenseNumber', 'Driver licence is not in the SAP driver master')

  if (data.transporterCode && !masters.transporter)
    fail('transporterCode', 'Transporter is not in the SAP transporter master')

  if (data.tankerNumber && !masters.tanker)
    fail('tankerNumber', 'Tanker is not in the SAP tanker master')

  const destinations = new Map(masters.destinations.map((row) => [row.code, row]))

  for (const destination of data.destinations) {
    if (!destinations.has(destination.code))
      fail('destinations', `Destination ${destination.code} is not in the SAP destination master`)
  }

  const contracts = new Map(masters.contracts.map((row) => [row.doNumber, row]))
  const { names } = masters

  const dos = data.dos.map((line) => {
    const contract = contracts.get(line.doNumber)

    if (!contract) {
      fail('dos', `DO ${line.doNumber} is not in the SAP DO register`)

      return line
    }

    if (contract.isClosed) fail('dos', `DO ${line.doNumber} is closed`)

    const estateName = contract.estateCode ? names.estate.get(contract.estateCode) : undefined

    const resolved = {
      ...line,
      transactionCode: contract.transactionCode,
      transactionName: names.transactionType.get(contract.transactionCode) ?? '',
      commodityCode: contract.commodityCode ?? '',
      commodityName: (contract.commodityCode && names.commodity.get(contract.commodityCode)) || '',
      contractNumber: contract.contractNumber ?? '',
      relationCode: contract.relationCode ?? '',
      relationName: (contract.relationCode && names.relation.get(contract.relationCode)) || '',
      transporterCode: contract.transporterCode ?? '',
      estate: estateName ?? contract.estateCode ?? '',
      piNumber: contract.piNumber ?? '',
    }

    // The contract decides the transaction type, so check the loading-note rule again.
    if (resolved.transactionCode === 'JUL' && !resolved.loadingNoteNumber)
      fail('dos', 'Enter the loading note for a sale (JUL)')

    return resolved
  })

  if (Object.keys(errors).length) throw new ValidationError(errors)

  return {
    ...data,
    plateNumber,
    driverName: masters.driver?.name ?? data.driverName,
    transporterName: masters.transporter?.name ?? data.transporterName,
    destinations: data.destinations.map((destination) => ({
      ...destination,
      name: destinations.get(destination.code)?.name ?? destination.name,
    })),
    dos,
  }
}

export default {
  async list(query: RegistrationListFilter): Promise<RegistrationListResult> {
    const { items, total, groups } = await repository.list(query)

    const count = (status: string) =>
      groups.find((group) => group.status === status)?._count._all ?? 0

    const counts: RegistrationCounts = {
      all: groups.reduce((sum, group) => sum + group._count._all, 0),
      open: count('OPEN'),
      checkedOut: count('CHECKED_OUT'),
      cancelled: count('CANCELLED'),
    }

    return {
      items: items.map(present),
      total,
      counts,
    }
  },
  async create(input: RegistrationCreateData, operatorId: string): Promise<RegistrationCreated> {
    const data = await withMasters(input)

    for (let attempt = 1; ; attempt++) {
      try {
        return await repository.create(data, operatorId)
      } catch (error) {
        if (attempt >= 3 || !retryable(error)) throw error
      }
    }
  },
}
