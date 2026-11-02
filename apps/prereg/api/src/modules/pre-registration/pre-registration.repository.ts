import { prisma } from '../../config/prisma'
import type { PreRegistration } from '../../generated/prisma/client'

export type { PreRegistration }

export default {
  findById(id: string): Promise<PreRegistration | null> {
    return prisma.preRegistration.findUnique({ where: { id } })
  },
}
