import { prisma } from '../../config/prisma'
import { CustomError } from '@awb/server-core'
import type {
  DriverVehicleApprovedEvent,
  DriverRequestSortField,
  SortDirection,
} from '@awb/contracts'
import type { Prisma } from '../../generated/prisma/client'
import { driverAddress } from '../../lib/master-data'
import type {
  DriverRequestDecisionInput,
  DriverRequestIdentity,
  DriverRequestRecord,
} from '../../types/driverRequest'

function driverData(request: DriverRequestRecord, now: Date) {
  return {
    name: request.driverName ?? '',
    address: driverAddress(request),
    birthPlace: request.driverBirthPlace,
    birthDate: request.driverBirthDate,
    phone: request.driverPhone,
    city: request.driverCity,
    licensePhotoUrl: request.driverLicensePhotoUrl,
    driverPhotoUrl: request.driverPhotoUrl,
    isActive: true,
    inSap: true,
    sapSyncedAt: now,
  }
}

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
            kind: true,
            status: true,
            driverName: true,
            driverLicenseNumber: true,
            vehiclePlateNumber: true,
            siteId: true,
            submittedBy: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.driverRequest.count({ where }),
      ],
      { isolationLevel: 'RepeatableRead' },
    )

    return {
      rows,
      total,
    }
  },

  findById(id: string) {
    return prisma.driverRequest.findUnique({
      where: { id },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
        decisions: {
          orderBy: [{ decidedAt: 'desc' }],
          select: {
            id: true,
            decision: true,
            rejectionReason: true,
            note: true,
            decidedAt: true,
            decider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })
  },

  // Returns all SUBMITTED or APPROVED requests that have the same license or plate,
  // excluding the given request id (used when checking conflicts on resubmit).
  async findConflicts(identity: DriverRequestIdentity, excludeId?: string) {
    return prisma.driverRequest.findMany({
      where: {
        status: {
          in: ['SUBMITTED', 'APPROVED', 'SENT_TO_PLANT'],
        },
        ...(excludeId
          ? {
              id: { not: excludeId },
            }
          : {}),
        ...(identity.licenseNumber
          ? {
              driverLicenseNumber: {
                equals: identity.licenseNumber,
                mode: 'insensitive',
              },
            }
          : {
              vehiclePlateNumber: {
                equals: identity.plateNumber,
                mode: 'insensitive',
              },
            }),
      },
      select: { id: true },
    })
  },

  findDocuments(ids: string[]) {
    return prisma.document.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        uploadedBy: true,
        category: true,
      },
    })
  },

  plants(userId?: string) {
    return prisma.plant.findMany({
      where: {
        isActive: true,
        ...(userId
          ? {
              users: {
                some: { userId },
              },
            }
          : {}),
      },
      select: {
        code: true,
        name: true,
      },
      orderBy: [{ name: 'asc' }, { code: 'asc' }],
    })
  },

  plantNames(codes: string[]) {
    return prisma.plant.findMany({
      where: {
        code: { in: codes },
      },
      select: {
        code: true,
        name: true,
      },
    })
  },

  findSite(code: string) {
    return prisma.plant.findUnique({
      where: {
        code,
        isActive: true,
      },
      select: { code: true },
    })
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
          where: {
            id,
            submittedBy,
            status: 'REJECTED',
          },
          data,
        })

        if (result.count !== 1)
          throw new CustomError('Only rejected requests can be resubmitted', 422)

        return tx.driverRequest.findUniqueOrThrow({
          where: { id },
        })
      }),
    )
  },

  decide(requestId: string, deciderId: string, decision: DriverRequestDecisionInput) {
    return prisma.$transaction(async (tx) => {
      const now = new Date()

      const changed = await tx.driverRequest.updateMany({
        where: {
          id: requestId,
          status: 'SUBMITTED',
        },
        data: {
          status: decision.decision,
          decision: decision.decision,
          decidedBy: deciderId,
          decidedAt: now,
          rejectionReason: decision.rejectionReason ?? null,
        },
      })

      if (changed.count !== 1) throw new CustomError('Driver request is already processed', 409)

      const record = await tx.driverRequestDecision.create({
        data: {
          requestId,
          decision: decision.decision,
          rejectionReason: decision.rejectionReason ?? null,
          note: decision.note ?? null,
          decidedBy: deciderId,
          decidedAt: now,
        },
      })

      const request = await tx.driverRequest.findUniqueOrThrow({
        where: { id: requestId },
      })

      return {
        request,
        decision: record,
      }
    })
  },

  confirmInSap(requestId: string, siteId: string, event: DriverVehicleApprovedEvent) {
    return prisma.$transaction(async (tx) => {
      // Per-site ordering prevents a later committed sequence hiding an earlier event.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${siteId}), 14)`
      const now = new Date()

      const request = await tx.driverRequest.findUniqueOrThrow({
        where: { id: requestId },
      })

      if (request.status !== 'APPROVED')
        throw new CustomError('Only approved requests can be confirmed in SAP', 409)

      const driver =
        request.kind === 'DRIVER' && request.driverLicenseNumber
          ? await tx.driver.upsert({
              where: { licenseNumber: request.driverLicenseNumber },
              create: {
                licenseNumber: request.driverLicenseNumber,
                ...driverData(request, now),
              },
              update: driverData(request, now),
            })
          : null

      const vehicleData = {
        stnkPhotoUrl: request.vehicleStnkPhotoUrl,
        isActive: true,
        inSap: true,
        sapSyncedAt: now,
      }

      const vehicle =
        request.kind === 'VEHICLE' && request.vehiclePlateNumber
          ? await tx.vehicle.upsert({
              where: { plateNumber: request.vehiclePlateNumber },
              create: {
                plateNumber: request.vehiclePlateNumber,
                ...vehicleData,
              },
              update: vehicleData,
            })
          : null

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

      const updated = await tx.driverRequest.update({
        where: { id: requestId },
        data: {
          status: 'SENT_TO_PLANT',
          driverId: driver?.id ?? null,
          vehicleId: vehicle?.id ?? null,
          sentToPlantAt: now,
        },
      })

      return {
        request: updated,
        outbox,
      }
    })
  },
}
