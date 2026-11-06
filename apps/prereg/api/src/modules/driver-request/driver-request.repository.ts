import { prisma } from '../../config/prisma'
import type { Prisma } from '../../generated/prisma/client'
import type { DriverVehicleApprovedEvent } from '@awb/contracts'

export default {
  list(where: Prisma.DriverRequestWhereInput, limit: number) {
    return prisma.driverRequest.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        status: true,
        driverName: true,
        vehiclePlateNumber: true,
        submittedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  findById(id: string) {
    return prisma.driverRequest.findUnique({
      where: { id },
      include: {
        transporter: true,
      },
    })
  },

  async approveAndEnqueue(
    requestId: string,
    approverId: string,
    siteId: string,
    event: DriverVehicleApprovedEvent,
  ) {
    return prisma.$transaction(async (tx) => {
      const now = new Date()

      const request = await tx.driverRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          decision: 'APPROVED',
          decidedBy: approverId,
          decidedAt: now,
          siteId,
        },
      })

      const decision = await tx.driverRequestDecision.create({
        data: {
          requestId,
          decision: 'APPROVED',
          decidedBy: approverId,
          decidedAt: now,
        },
      })

      const outbox = await tx.syncOutbox.create({
        data: {
          eventId: event.eventId,
          eventType: event.eventType,
          siteId,
          aggregateId: requestId,
          payload: event as unknown as Prisma.InputJsonValue,
          status: 'PENDING',
        },
      })

      return { request, decision, outbox }
    })
  },
}
