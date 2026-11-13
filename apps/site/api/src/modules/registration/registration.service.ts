import {
  registrationPhaseOf,
  registrationPhases,
  type RegistrationCardStatus,
  type RegistrationCounts,
  type RegistrationCreateData,
  type RegistrationCreated,
  type RegistrationListItem,
  type RegistrationListResult,
  type RegistrationStatus,
  type WeighingType,
} from '@awb/contracts'
import type {
  DecodedPhoto,
  FlowPlacement,
  ListedRegistration,
  RegistrationListFilter,
} from '../../types/registration'
import { NotFoundError, ValidationError } from '@awb/server-core'
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
    transporterName: row.transporterName,
    weighingType: row.weighingType as WeighingType,
    otherPartyNet: row.otherPartyNet?.toString() ?? null,
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
    hasDriverPhoto: row.photos.some((photo) => photo.kind === 'DRIVER'),
    flow: {
      code: row.flow.code,
      name: row.flow.name,
    },
    stage: {
      code: row.stage.stageCode,
      name: row.stage.name,
      step: row.stage.stepOrder,
      steps: row.flow._count.stages,
    },
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

/** The contract checked the data URL; this checks that the bytes really are a JPEG. */
function decodePhoto(dataUrl: string): DecodedPhoto {
  const content = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')

  if (content[0] !== 0xff || content[1] !== 0xd8 || content[2] !== 0xff)
    throw new ValidationError({
      driverPhoto: ['The driver photo is not a readable JPEG; take it again'],
    })

  return {
    mimeType: 'image/jpeg',
    content,
  }
}

/**
 * The form is pick-only: every code must be an active SAP master row. Names, and the DO details,
 * are taken from the masters rather than from what the client sent. The card must not be held
 * by a truck that is still in the plant.
 */
async function withMasters(data: RegistrationCreateData): Promise<RegistrationCreateData> {
  const plateNumber = plate(data.plateNumber) ?? ''
  const doNumbers = data.dos.map((line) => line.doNumber)

  const [masters, cardHolder] = await Promise.all([
    masterService.forRegistration({
      plateNumber,
      licenseNumber: data.licenseNumber || null,
      transporterCode: data.transporterCode || null,
      tankerNumber: data.tankerNumber || null,
      destinations: data.destinations.map((destination) => destination.code),
      doNumbers,
    }),
    repository.holderOfCard(data.cardNumber),
  ])

  const errors: Record<string, string[]> = {}
  const fail = (field: string, message: string) => (errors[field] ??= []).push(message)

  if (!masters.vehicle) fail('plateNumber', 'Truck plate is not in the SAP truck master')

  if (cardHolder)
    fail(
      'cardNumber',
      `Card ${data.cardNumber} is still with ${cardHolder.number} (${cardHolder.plateNumber}); finish or cancel that registration first`,
    )

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

  if (new Set(dos.map((line) => line.transactionCode)).size > 1)
    fail('dos', 'All DOs on one truck must have the same transaction type')

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

/**
 * The flow comes from the transaction type, unless every DO's commodity has its own flow (FAME).
 * Saving the form completes Registration In, so the truck starts at the next stage.
 */
async function placeInFlow(dos: RegistrationCreateData['dos']): Promise<FlowPlacement> {
  const transactionCode = dos[0]?.transactionCode ?? ''
  const commodities = dos.map((line) => line.commodityCode)

  const rules = await repository.flowRules(transactionCode, [
    ...new Set(commodities.filter(Boolean)),
  ])

  const commodityFlow = (code: string) =>
    (
      rules.find(
        (rule) => rule.commodityCode === code && rule.transactionCode === transactionCode,
      ) ?? rules.find((rule) => rule.commodityCode === code && rule.transactionCode === null)
    )?.flowCode

  const byCommodity = commodities.map((code) => (code ? commodityFlow(code) : undefined))

  const flowCode =
    byCommodity[0] && byCommodity.every((code) => code === byCommodity[0])
      ? byCommodity[0]
      : rules.find((rule) => rule.transactionCode === transactionCode && !rule.commodityCode)
          ?.flowCode

  if (!flowCode)
    throw new ValidationError({
      dos: [`No plant flow is set up for transaction type ${transactionCode}`],
    })

  const stages = await repository.flowStages(flowCode)
  const registIn = stages.findIndex((stage) => stage.stageCode === 'regist_in')
  const start = stages[registIn + 1] ?? stages[0]

  if (!start) throw new Error(`Flow ${flowCode} has no stages`)

  return {
    flowCode,
    stageCode: start.stageCode,
  }
}

export default {
  async list(query: RegistrationListFilter): Promise<RegistrationListResult> {
    const { items, total, groups } = await repository.list(query)

    const counts = Object.fromEntries([
      ['all', 0],
      ...registrationPhases.map((phase) => [phase, 0]),
    ]) as RegistrationCounts

    for (const group of groups) {
      counts.all += group._count._all
      counts[registrationPhaseOf(group.status, group.stageCode)] += group._count._all
    }

    return {
      items: items.map(present),
      total,
      counts,
    }
  },
  async cardStatus(cardNumber: string): Promise<RegistrationCardStatus> {
    return {
      cardNumber,
      heldBy: await repository.holderOfCard(cardNumber),
    }
  },
  async driverPhoto(registrationId: string) {
    const photo = await repository.photo(registrationId, 'DRIVER')

    if (!photo) throw new NotFoundError('This registration has no driver photo')

    return photo
  },
  async create(input: RegistrationCreateData, operatorId: string): Promise<RegistrationCreated> {
    const driverPhoto = decodePhoto(input.driverPhoto)
    const data = await withMasters(input)
    const placement = await placeInFlow(data.dos)

    for (let attempt = 1; ; attempt++) {
      try {
        return await repository.create(data, placement, driverPhoto, operatorId)
      } catch (error) {
        if (attempt >= 3 || !retryable(error)) throw error
      }
    }
  },
}
