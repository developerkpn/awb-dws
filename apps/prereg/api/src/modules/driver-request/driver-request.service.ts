import { randomUUID } from 'node:crypto'
import type { z } from 'zod'
import { CustomError, NotFoundError } from '@awb/server-core'
import type { SessionUser, DriverVehicleApprovedEvent } from '@awb/contracts'
import repository from './driver-request.repository'
import type { listDriverRequests, approveDriverRequestSchema } from './driver-request.schema'

export default {
  async list(query: z.infer<typeof listDriverRequests>, user: SessionUser) {
    const reviewer =
      user.role === 'ADMIN' ||
      (user.role === 'LOGISTIC' && user.permissions.includes('prereg:approve'))
    const rows = await repository.list(
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
      query.limit,
    )
    const items = rows.slice(0, query.limit)
    const last = items.at(-1)

    return {
      items,
      nextCursor:
        rows.length > query.limit && last
          ? { cursorAt: last.createdAt.toISOString(), cursorId: last.id }
          : null,
    }
  },

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

    const siteId = input?.siteId || request.siteId || 'PRISCOLIN_KARAWANG'
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
