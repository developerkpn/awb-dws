import { prisma } from '../../config/prisma'
import type { Prisma } from '../../generated/prisma/client'

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
        driverLicenseNumber: true,
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
  findConflicts(licenseNumber: string, plateNumber: string, excludeId?: string) {
    return prisma.driverRequest.findMany({
      where: {
        status: { in: ['SUBMITTED', 'APPROVED'] },
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

  create(
    data: Omit<
      Prisma.DriverRequestUncheckedCreateInput,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >,
  ) {
    return prisma.driverRequest.create({ data })
  },

  update(id: string, data: Prisma.DriverRequestUncheckedUpdateInput) {
    return prisma.driverRequest.update({ where: { id }, data })
  },
}
