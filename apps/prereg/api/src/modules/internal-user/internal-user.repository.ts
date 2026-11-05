import { prisma } from '../../config/prisma'

export default {
  async findRoleByCode(code: string) {
    return prisma.role.findUnique({
      where: { code },
    })
  },

  async findPlantsByIds(ids: string[]) {
    if (!ids.length) return []
    return prisma.plant.findMany({
      where: { id: { in: ids } },
    })
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        plants: {
          include: { plant: true },
        },
      },
    })
  },

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        role: true,
        plants: {
          include: { plant: true },
        },
      },
    })
  },

  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email },
      include: {
        role: true,
        plants: {
          include: { plant: true },
        },
      },
    })
  },

  async findAllInternal() {
    return prisma.user.findMany({
      where: { accountType: 'INTERNAL' },
      include: {
        role: true,
        plants: {
          include: { plant: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async create(data: {
    name: string
    username: string
    email: string
    phone?: string
    passwordHash: string
    roleId: string
    plantIds?: string[]
  }) {
    return prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        accountType: 'INTERNAL',
        roleId: data.roleId,
        isActive: true,
        plants: data.plantIds?.length
          ? {
              create: data.plantIds.map((plantId) => ({ plantId })),
            }
          : undefined,
      },
      include: {
        role: true,
        plants: {
          include: { plant: true },
        },
      },
    })
  },

  async update(
    id: string,
    data: {
      name?: string
      email?: string
      phone?: string
      roleId?: string
      plantIds?: string[]
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // If plantIds is explicitly provided, replace existing associations
      if (data.plantIds !== undefined) {
        await tx.userPlant.deleteMany({ where: { userId: id } })
        if (data.plantIds.length > 0) {
          await tx.userPlant.createMany({
            data: data.plantIds.map((plantId) => ({ userId: id, plantId })),
          })
        }
      }

      return tx.user.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          roleId: data.roleId,
        },
        include: {
          role: true,
          plants: {
            include: { plant: true },
          },
        },
      })
    })
  },

  async updateStatus(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      include: {
        role: true,
        plants: {
          include: { plant: true },
        },
      },
    })
  },

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    })
  },
}
