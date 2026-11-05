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
        vehiclePlateNumber: true,
        submittedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },
}
