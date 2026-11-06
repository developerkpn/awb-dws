import { prisma } from '../../config/prisma'

export default {
  listOutbox(after: number, limit: number, siteId?: string) {
    return prisma.syncOutbox.findMany({
      where: {
        id: { gt: after },
        ...(siteId ? { siteId } : {}),
      },
      take: limit,
      orderBy: { id: 'asc' },
    })
  },

  acknowledge(upTo: number, siteId?: string) {
    return prisma.syncOutbox.updateMany({
      where: {
        id: { lte: upTo },
        status: 'PENDING',
        ...(siteId ? { siteId } : {}),
      },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
    })
  },
}
