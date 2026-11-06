import { prisma } from '../../config/prisma'
import { CustomError } from '@awb/server-core'
import type {
  DriverVehicleApprovedEvent,
  DriverRequestSortField,
  SortDirection,
} from '@awb/contracts'
import type { Prisma } from '../../generated/prisma/client'

async function writeRequest<T>(operation: () => Promise<T>) {
  try {
    return await operation()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new CustomError(
        'A pending or approved request already exists for this license number or plate number',
        409,
      )
    }
    throw error
  }
}

export default {
  async list(
    where: Prisma.DriverRequestWhereInput,
    query: {
      page: number
      limit: number
      sortBy: DriverRequestSortField
      sortDirection: SortDirection
    },
  ) {
    const [rows, total] = await prisma.$transaction(
      [
        prisma.driverRequest.findMany({
          where,
          skip: (query.page - 1) * query.limit,
          take: query.limit + 1,
          orderBy: [{ [query.sortBy]: query.sortDirection }, { id: query.sortDirection }],
          select: {
            id: true,
            status: true,
            driverName: true,
            driverLicenseNumber: true,
            vehiclePlateNumber: true,
            submittedBy: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.driverRequest.count({ where }),
      ],
      { isolationLevel: 'RepeatableRead' },
    )
    return { rows, total }
  },

  findById(id: string) {
    return prisma.driverRequest.findUnique({
      where: { id },
      include: {
        transporter: { select: { id: true, code: true, name: true } },
        decisions: {
          orderBy: [{ decidedAt: 'desc' }],
          select: {
            id: true,
            decision: true,
            rejectionReason: true,
            decidedAt: true,
            decider: { select: { id: true, name: true } },
          },
        },
      },
    })
  },

  // Returns all SUBMITTED or APPROVED requests that have the same license or plate,
  // excluding the given request id (used when checking conflicts on resubmit).
  async findConflicts(licenseNumber: string, plateNumber: string, excludeId?: string) {
    return prisma.driverRequest.findMany({
      where: {
        status: { in: ['SUBMITTED', 'APPROVED', 'SENT_TO_PLANT'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
          { driverLicenseNumber: { equals: licenseNumber, mode: 'insensitive' } },
          { vehiclePlateNumber: { equals: plateNumber, mode: 'insensitive' } },
        ],
      },
      select: { id: true, driverLicenseNumber: true, vehiclePlateNumber: true },
    })
  },

  findTransporter(id: string) {
    return prisma.transporter.findUnique({ where: { id, isActive: true }, select: { id: true } })
  },

  listTransporters() {
    return prisma.transporter.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    })
  },

  findDocuments(ids: string[]) {
    return prisma.document.findMany({
      where: { id: { in: ids } },
      select: { id: true, uploadedBy: true, category: true },
    })
  },

  findSite(code: string) {
    return prisma.plant.findUnique({ where: { code, isActive: true }, select: { code: true } })
  },

  create(
    data: Omit<
      Prisma.DriverRequestUncheckedCreateInput,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >,
  ) {
    return writeRequest(() => prisma.driverRequest.create({ data }))
  },

  update(id: string, submittedBy: string, data: Prisma.DriverRequestUncheckedUpdateManyInput) {
    return writeRequest(() =>
      prisma.$transaction(async (tx) => {
        const result = await tx.driverRequest.updateMany({
          where: { id, submittedBy, status: 'REJECTED' },
          data,
        })
        if (result.count !== 1)
          throw new CustomError('Only rejected requests can be resubmitted', 422)
        return tx.driverRequest.findUniqueOrThrow({ where: { id } })
      }),
    )
  },

  async approveAndEnqueue(
    requestId: string,
    approverId: string,
    siteId: string,
    event: DriverVehicleApprovedEvent,
  ) {
    return prisma.$transaction(async (tx) => {
      // Per-site ordering prevents a later committed sequence hiding an earlier event.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${siteId}), 14)`
      const now = new Date()

      const changed = await tx.driverRequest.updateMany({
        where: { id: requestId, status: 'SUBMITTED' },
        data: {
          status: 'APPROVED',
          decision: 'APPROVED',
          decidedBy: approverId,
          decidedAt: now,
          siteId,
        },
      })
      if (changed.count !== 1) throw new CustomError('Driver request is already processed', 400)
      const request = await tx.driverRequest.findUniqueOrThrow({ where: { id: requestId } })

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
