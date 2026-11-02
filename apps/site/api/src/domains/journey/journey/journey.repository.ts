import { prisma } from '../../../config/prisma'
import type { Journey } from '../../../generated/prisma/client'

export type { Journey }

export default {
  findById(id: string): Promise<Journey | null> {
    return prisma.journey.findUnique({ where: { id } })
  },
}
