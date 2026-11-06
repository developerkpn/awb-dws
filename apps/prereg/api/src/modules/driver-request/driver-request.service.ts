import { randomUUID } from 'node:crypto'
import type { z } from 'zod'
import { CustomError, NotFoundError } from '@awb/server-core'
import type { SessionUser, DriverVehicleApprovedEvent } from '@awb/contracts'
import { notifyLogisticsSubmission } from '../../services/mailer'
import repository from './driver-request.repository'
import type {
  listDriverRequests,
  driverRequestBody,
  approveDriverRequestSchema,
} from './driver-request.schema'

type ListQuery = z.infer<typeof listDriverRequests>
type RequestBody = z.infer<typeof driverRequestBody>

function isReviewer(user: SessionUser) {
  return (
    user.role === 'ADMIN' ||
    (user.role === 'LOGISTIC' && user.permissions.includes('prereg:approve'))
  )
}

async function checkConflicts(licenseNumber: string, plateNumber: string, excludeId?: string) {
  const conflicts = await repository.findConflicts(licenseNumber, plateNumber, excludeId)
  const licenseConflict = conflicts.find(
    (r) => r.driverLicenseNumber.toLowerCase() === licenseNumber.toLowerCase(),
  )
  if (licenseConflict)
    throw new CustomError(
      'A pending or approved request already exists for this license number',
      409,
    )

  const plateConflict = conflicts.find(
    (r) => r.vehiclePlateNumber.toLowerCase() === plateNumber.toLowerCase(),
  )
  if (plateConflict)
    throw new CustomError('A pending or approved request already exists for this plate number', 409)
}

async function resolveTransporter(transporterId?: string) {
  if (!transporterId) return undefined
  const found = await repository.findTransporter(transporterId)
  if (!found) throw new CustomError('Transporter not found or inactive', 422)
  return transporterId
}

async function validateDocuments(body: RequestBody, user: SessionUser) {
  const references = [
    { url: body.driverLicensePhotoUrl, category: 'sim' },
    { url: body.driverPhotoUrl, category: 'driver' },
    { url: body.vehicleStnkPhotoUrl, category: 'stnk' },
  ].filter((entry): entry is { url: string; category: string } => Boolean(entry.url))
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

export default {
  async list(query: ListQuery, user: SessionUser) {
    const reviewer = isReviewer(user)
    const { rows, total } = await repository.list(
      {
        ...(!reviewer ? { submittedBy: user.id } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.cursorAt && query.cursorId
          ? {
              OR: [
                { createdAt: { lt: new Date(query.cursorAt) } },
                { createdAt: new Date(query.cursorAt), id: { lt: query.cursorId } },
              ],
            }
          : {}),
      },
      query,
    )
    const items = rows.slice(0, query.limit)
    const last = items.at(-1)

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      nextCursor:
        rows.length > query.limit && last
          ? { cursorAt: last.createdAt.toISOString(), cursorId: last.id }
          : null,
    }
  },

  async getById(id: string, user: SessionUser) {
    const request = await repository.findById(id)
    if (!request) throw new NotFoundError('Request not found')
    // Non-reviewers can only see their own requests.
    if (!isReviewer(user) && request.submittedBy !== user.id)
      throw new NotFoundError('Request not found')
    return request
  },

  async create(body: RequestBody, user: SessionUser) {
    await checkConflicts(body.driverLicenseNumber, body.vehiclePlateNumber)
    await resolveTransporter(body.transporterId)
    await validateDocuments(body, user)

    const request = await repository.create({
      submittedBy: user.id,
      driverLicenseNumber: body.driverLicenseNumber,
      driverName: body.driverName,
      driverAddress: body.driverAddress,
      driverBirthPlace: body.driverBirthPlace,
      driverBirthDate: new Date(body.driverBirthDate),
      driverPhone: body.driverPhone,
      driverCity: body.driverCity ?? null,
      driverLicensePhotoUrl: body.driverLicensePhotoUrl ?? null,
      driverPhotoUrl: body.driverPhotoUrl ?? null,
      vehiclePlateNumber: body.vehiclePlateNumber,
      transporterId: body.transporterId ?? null,
      vehicleStnkPhotoUrl: body.vehicleStnkPhotoUrl ?? null,
    })

    notifyLogisticsSubmission(request.id, request.driverName, request.vehiclePlateNumber)
    return request
  },

  async resubmit(id: string, body: RequestBody, user: SessionUser) {
    const request = await repository.findById(id)
    if (!request) throw new NotFoundError('Request not found')
    if (request.submittedBy !== user.id) throw new NotFoundError('Request not found')
    if (request.status !== 'REJECTED')
      throw new CustomError('Only rejected requests can be resubmitted', 422)

    await checkConflicts(body.driverLicenseNumber, body.vehiclePlateNumber, id)
    await resolveTransporter(body.transporterId)
    await validateDocuments(body, user)

    const updated = await repository.update(id, user.id, {
      status: 'SUBMITTED',
      driverLicenseNumber: body.driverLicenseNumber,
      driverName: body.driverName,
      driverAddress: body.driverAddress,
      driverBirthPlace: body.driverBirthPlace,
      driverBirthDate: new Date(body.driverBirthDate),
      driverPhone: body.driverPhone,
      driverCity: body.driverCity ?? null,
      driverLicensePhotoUrl: body.driverLicensePhotoUrl ?? null,
      driverPhotoUrl: body.driverPhotoUrl ?? null,
      vehiclePlateNumber: body.vehiclePlateNumber,
      transporterId: body.transporterId ?? null,
      vehicleStnkPhotoUrl: body.vehicleStnkPhotoUrl ?? null,
      decidedBy: null,
      decidedAt: null,
      decision: null,
      rejectionReason: null,
    })

    notifyLogisticsSubmission(updated.id, updated.driverName, updated.vehiclePlateNumber)
    return updated
  },

  listTransporters: () => repository.listTransporters(),

  async approve(
    requestId: string,
    user: SessionUser,
    input?: z.infer<typeof approveDriverRequestSchema>,
  ) {
    const canApprove =
      user.role === 'ADMIN' ||
      (user.role === 'LOGISTIC' && user.permissions.includes('prereg:approve'))
    if (!canApprove) {
      throw new CustomError('Insufficient permission to approve driver request', 403)
    }

    const request = await repository.findById(requestId)
    if (!request) {
      throw new NotFoundError('Driver request not found')
    }

    if (request.status !== 'SUBMITTED') {
      throw new CustomError(`Driver request is already ${request.status.toLowerCase()}`, 400)
    }

    const siteId = input?.siteId || request.siteId
    if (!siteId || !(await repository.findSite(siteId))) {
      throw new CustomError('Choose an active destination plant', 422)
    }
    const now = new Date().toISOString()

    const event: DriverVehicleApprovedEvent = {
      eventId: randomUUID(),
      schemaVersion: 1,
      eventType: 'driver_vehicle.approved',
      aggregateId: request.id,
      aggregateVersion: 1,
      siteId,
      source: 'ho',
      target: siteId,
      occurredAt: now,
      recordedAt: now,
      payload: {
        requestId: request.id,
        siteId,
        driver: {
          licenseNumber: request.driverLicenseNumber,
          name: request.driverName,
          address: request.driverAddress,
          birthPlace: request.driverBirthPlace,
          birthDate: request.driverBirthDate.toISOString(),
          phone: request.driverPhone,
          city: request.driverCity,
          licensePhotoUrl: request.driverLicensePhotoUrl,
          driverPhotoUrl: request.driverPhotoUrl,
        },
        vehicle: {
          plateNumber: request.vehiclePlateNumber,
          transporterId: request.transporterId,
          transporterName: request.transporter?.name ?? null,
          transporterCode: request.transporter?.code ?? null,
          stnkPhotoUrl: request.vehicleStnkPhotoUrl,
        },
        approvedBy: user.id,
        approvedAt: now,
      },
    }

    const result = await repository.approveAndEnqueue(requestId, user.id, siteId, event)

    return {
      id: result.request.id,
      status: result.request.status,
      siteId,
      outboxId: result.outbox.id,
      eventId: result.outbox.eventId,
    }
  },
}
