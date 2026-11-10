import { randomUUID } from 'node:crypto'
import { CustomError, NotFoundError } from '@awb/server-core'
import type { SessionUser, DriverVehicleApprovedEvent } from '@awb/contracts'
import { notifyLogisticsSubmission, notifySubmitterDecision } from '../../services/mailer'
import { driverAddress, licenseKey, plateKey } from '../../lib/master-data'
import sapMaster from '../sap-master/sap-master.service'
import repository from './driver-request.repository'
import type {
  DriverRequestApprovalInput,
  DriverRequestBody,
  DriverRequestDecisionInput,
  DriverRequestListQuery,
  DriverRequestRecord,
  DriverRequestRejectionInput,
} from '../../types/driverRequest'

function isReviewer(user: SessionUser) {
  return (
    user.role === 'ADMIN' ||
    (user.role === 'LOGISTIC' && user.permissions.includes('prereg:approve'))
  )
}

function identity(
  request: Pick<DriverRequestRecord, 'kind' | 'driverLicenseNumber' | 'vehiclePlateNumber'>,
) {
  return (
    (request.kind === 'DRIVER' ? request.driverLicenseNumber : request.vehiclePlateNumber) ?? ''
  )
}

async function checkConflicts(user: SessionUser, body: DriverRequestBody, excludeId?: string) {
  const owner = {
    id: user.id,
    username: user.username,
    role: user.role,
  }

  if (body.kind === 'DRIVER') {
    if (await sapMaster.driver(owner, body.driverLicenseNumber))
      throw new CustomError(
        'This driver is already registered in SAP; select it when creating a registration',
        409,
      )

    if (
      (await repository.findConflicts({ licenseNumber: body.driverLicenseNumber }, excludeId))
        .length
    )
      throw new CustomError(
        'A pending or approved request already exists for this license number',
        409,
      )

    return
  }

  if (await sapMaster.vehicle(owner, body.vehiclePlateNumber))
    throw new CustomError(
      'This vehicle is already registered in SAP; select it when creating a registration',
      409,
    )

  if ((await repository.findConflicts({ plateNumber: body.vehiclePlateNumber }, excludeId)).length)
    throw new CustomError('A pending or approved request already exists for this plate number', 409)
}

async function checkPlant(user: SessionUser, siteId: string) {
  const plants = await repository.plants(user.accountType === 'PARTNER' ? user.id : undefined)

  if (!plants.some((plant) => plant.code === siteId))
    throw new CustomError('Choose one of your active plants', 422)
}

async function validateDocuments(body: DriverRequestBody, user: SessionUser) {
  const references =
    body.kind === 'DRIVER'
      ? [
          {
            url: body.driverLicensePhotoUrl,
            category: 'sim',
          },
          {
            url: body.driverPhotoUrl,
            category: 'driver',
          },
        ]
      : [
          {
            url: body.vehicleStnkPhotoUrl,
            category: 'stnk',
          },
        ]

  const documents = await repository.findDocuments(
    references.map((entry) => entry.url.split('/').at(-1)!),
  )

  for (const entry of references) {
    if (
      !documents.some(
        (doc) =>
          doc.id === entry.url.split('/').at(-1) &&
          doc.uploadedBy === user.id &&
          doc.category === entry.category,
      )
    ) {
      throw new CustomError('Use your own uploaded document with the matching category', 422)
    }
  }
}

function requestData(body: DriverRequestBody) {
  const empty = {
    driverLicenseNumber: null,
    driverName: null,
    driverBirthPlace: null,
    driverBirthDate: null,
    driverPhone: null,
    driverCity: null,
    driverAddress: null,
    driverAddress2: null,
    driverAddress3: null,
    driverLicensePhotoUrl: null,
    driverPhotoUrl: null,
    vehiclePlateNumber: null,
    vehicleStnkPhotoUrl: null,
  }

  if (body.kind === 'DRIVER')
    return {
      ...empty,
      kind: body.kind,
      siteId: body.siteId,
      driverLicenseNumber: licenseKey(body.driverLicenseNumber),
      driverName: body.driverName,
      driverBirthPlace: body.driverBirthPlace,
      driverBirthDate: new Date(body.driverBirthDate),
      driverPhone: body.driverPhone,
      driverCity: body.driverCity,
      driverAddress: body.driverAddress,
      driverAddress2: body.driverAddress2 || null,
      driverAddress3: body.driverAddress3 || null,
      driverLicensePhotoUrl: body.driverLicensePhotoUrl,
      driverPhotoUrl: body.driverPhotoUrl,
    }

  return {
    ...empty,
    kind: body.kind,
    siteId: body.siteId,
    vehiclePlateNumber: plateKey(body.vehiclePlateNumber),
    vehicleStnkPhotoUrl: body.vehicleStnkPhotoUrl,
  }
}

async function withPlantNames<T extends { siteId: string | null }>(rows: T[]) {
  const codes = [...new Set(rows.map((row) => row.siteId).filter((code) => code !== null))]

  const names = new Map(
    (await repository.plantNames(codes)).map((plant) => [plant.code, plant.name]),
  )

  return rows.map((row) => ({
    ...row,
    plantName: row.siteId ? (names.get(row.siteId) ?? row.siteId) : null,
  }))
}

async function prepare(body: DriverRequestBody, user: SessionUser, excludeId?: string) {
  const normalized: DriverRequestBody =
    body.kind === 'DRIVER'
      ? {
          ...body,
          driverLicenseNumber: licenseKey(body.driverLicenseNumber),
        }
      : {
          ...body,
          vehiclePlateNumber: plateKey(body.vehiclePlateNumber),
        }

  await checkConflicts(user, normalized, excludeId)
  await checkPlant(user, normalized.siteId)

  await validateDocuments(normalized, user)

  return requestData(normalized)
}

async function decide(requestId: string, user: SessionUser, decision: DriverRequestDecisionInput) {
  if (!isReviewer(user))
    throw new CustomError('Insufficient permission to review driver and vehicle requests', 403)

  const request = await repository.findById(requestId)

  if (!request) throw new NotFoundError('Request not found')

  if (request.status !== 'SUBMITTED')
    throw new CustomError(`Request is already ${request.status.toLowerCase()}`, 409)

  const result = await repository.decide(requestId, user.id, decision)

  notifySubmitterDecision(
    request.id,
    request.submitter.email ?? request.submitter.username,
    decision.decision,
    decision.rejectionReason ?? decision.note,
  )

  return {
    id: result.request.id,
    status: result.request.status,
    decision: result.decision.decision,
    note: result.decision.note,
    rejectionReason: result.decision.rejectionReason,
  }
}

export default {
  async list(query: DriverRequestListQuery, user: SessionUser) {
    const { rows, total } = await repository.list(
      {
        ...(!isReviewer(user) ? { submittedBy: user.id } : {}),
        ...(query.status
          ? {
              status: { in: query.status },
            }
          : {}),
        ...(query.kind ? { kind: query.kind } : {}),
        ...(query.siteId ? { siteId: query.siteId } : {}),
        ...(query.cursorAt && query.cursorId
          ? {
              OR: [
                {
                  createdAt: {
                    lt: new Date(query.cursorAt),
                  },
                },
                {
                  createdAt: new Date(query.cursorAt),
                  id: { lt: query.cursorId },
                },
              ],
            }
          : {}),
      },
      query,
    )

    const items = await withPlantNames(rows.slice(0, query.limit))
    const last = items.at(-1)

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      nextCursor:
        rows.length > query.limit && last
          ? {
              cursorAt: last.createdAt.toISOString(),
              cursorId: last.id,
            }
          : null,
    }
  },

  async getById(id: string, user: SessionUser) {
    const request = await repository.findById(id)

    if (!request) throw new NotFoundError('Request not found')

    // Non-reviewers can only see their own requests.
    if (!isReviewer(user) && request.submittedBy !== user.id)
      throw new NotFoundError('Request not found')

    return (await withPlantNames([request]))[0]!
  },

  plants(user: SessionUser) {
    return repository.plants(user.accountType === 'PARTNER' ? user.id : undefined)
  },

  async create(body: DriverRequestBody, user: SessionUser) {
    const data = await prepare(body, user)

    const request = await repository.create({
      submittedBy: user.id,
      ...data,
    })

    notifyLogisticsSubmission(request.id, request.kind, identity(request))

    return request
  },

  async resubmit(id: string, body: DriverRequestBody, user: SessionUser) {
    const request = await repository.findById(id)

    if (!request || request.submittedBy !== user.id) throw new NotFoundError('Request not found')

    if (request.status !== 'REJECTED')
      throw new CustomError('Only rejected requests can be resubmitted', 422)

    if (request.kind !== body.kind)
      throw new CustomError('A driver request cannot become a vehicle request', 422)

    const data = await prepare(body, user, id)

    const updated = await repository.update(id, user.id, {
      status: 'SUBMITTED',
      ...data,
      decidedBy: null,
      decidedAt: null,
      decision: null,
      rejectionReason: null,
    })

    notifyLogisticsSubmission(updated.id, updated.kind, identity(updated))

    return updated
  },

  approve(requestId: string, user: SessionUser, input: DriverRequestApprovalInput) {
    return decide(requestId, user, {
      decision: 'APPROVED',
      note: input.note || undefined,
    })
  },

  reject(requestId: string, user: SessionUser, input: DriverRequestRejectionInput) {
    return decide(requestId, user, {
      decision: 'REJECTED',
      rejectionReason: input.rejectionReason,
    })
  },

  // Runs when SAP has created the driver or truck: saves it locally and sends it to the plant.
  async confirmInSap(requestId: string) {
    const request = await repository.findById(requestId)

    if (!request) throw new NotFoundError('Request not found')

    if (!request.siteId || !request.decidedBy || !request.decidedAt)
      throw new CustomError('Request has no approved plant', 409)

    const now = new Date().toISOString()
    const approvedAt = request.decidedAt.toISOString()

    const event: DriverVehicleApprovedEvent = {
      eventId: randomUUID(),
      schemaVersion: 1,
      eventType: 'driver_vehicle.approved',
      aggregateId: request.id,
      aggregateVersion: 1,
      siteId: request.siteId,
      source: 'ho',
      target: request.siteId,
      occurredAt: approvedAt,
      recordedAt: now,
      payload: {
        requestId: request.id,
        siteId: request.siteId,
        driver:
          request.kind === 'DRIVER'
            ? {
                licenseNumber: request.driverLicenseNumber ?? '',
                name: request.driverName ?? '',
                address: driverAddress(request),
                birthPlace: request.driverBirthPlace ?? '',
                birthDate: (request.driverBirthDate ?? request.createdAt).toISOString(),
                phone: request.driverPhone ?? '',
                city: request.driverCity,
                licensePhotoUrl: request.driverLicensePhotoUrl,
                driverPhotoUrl: request.driverPhotoUrl,
              }
            : null,
        vehicle:
          request.kind === 'VEHICLE'
            ? {
                plateNumber: request.vehiclePlateNumber ?? '',
                stnkPhotoUrl: request.vehicleStnkPhotoUrl,
              }
            : null,
        approvedBy: request.decidedBy,
        approvedAt,
      },
    }

    const result = await repository.confirmInSap(requestId, request.siteId, event)

    return {
      id: result.request.id,
      status: result.request.status,
      siteId: request.siteId,
      outboxId: result.outbox.id,
      eventId: result.outbox.eventId,
    }
  },
}
