import { CustomError } from '@awb/server-core'
import { prisma } from '../../config/prisma'
import type { Prisma } from '../../generated/prisma/client'

const include = {
  role: true,
  partners: { include: { partner: true } },
  plants: { include: { plant: true } },
} as const
export type AccountData = {
  name: string
  username: string
  email: string | null
  phone: string | null
  accountType: string
  roleId: string
  partnerIds: string[]
  plantIds: string[]
}

async function ensureLoginAliases(tx: Prisma.TransactionClient, data: AccountData, id?: string) {
  const partners = await tx.partner.findMany({
    where: { id: { in: data.partnerIds } },
    select: { sapCode: true },
  })
  const names = [data.username, ...partners.map((partner) => partner.sapCode)]
  const collision = await tx.user.findFirst({
    where: {
      ...(id ? { id: { not: id } } : {}),
      OR: names.flatMap((name) => [
        { username: { equals: name, mode: 'insensitive' as const } },
        {
          partners: {
            some: { partner: { sapCode: { equals: name, mode: 'insensitive' as const } } },
          },
        },
      ]),
    },
    select: { id: true },
  })

  if (collision) throw new CustomError('Username or SAP login code is already in use', 409)
}

export default {
  findRoleByCode: (code: string) => prisma.role.findUnique({ where: { code } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id }, include }),
  findPartners: (ids: string[]) =>
    prisma.partner.findMany({ where: { id: { in: ids }, isActive: true } }),
  findPlants: (ids: string[]) =>
    prisma.plant.findMany({ where: { id: { in: ids }, isActive: true } }),
  async list(where: Prisma.UserWhereInput, page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])
    return { items, total, page, limit }
  },
  async options(q: string) {
    const [roles, plants, partners] = await Promise.all([
      prisma.role.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
      prisma.plant.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.partner.findMany({
        where: {
          isActive: true,
          users: { none: {} },
          ...(q
            ? {
                OR: [
                  { sapCode: { contains: q, mode: 'insensitive' as const } },
                  { name: { contains: q, mode: 'insensitive' as const } },
                ],
              }
            : {}),
        },
        orderBy: { sapCode: 'asc' },
        take: 50,
      }),
    ])
    return { roles, plants, partners }
  },
  async create(data: AccountData, passwordHash: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(183706)`
      await ensureLoginAliases(tx, data)
      const { plantIds, partnerIds, ...fields } = data
      const user = await tx.user.create({
        data: {
          ...fields,
          passwordHash,
          plants: { create: plantIds.map((plantId) => ({ plantId })) },
          partners: {
            create: partnerIds.map((partnerId, i) => ({ partnerId, isPrimary: i === 0 })),
          },
        },
        include,
      })
      await tx.accountAudit.create({
        data: { actorId, subjectId: user.id, action: 'account.created' },
      })
      return user
    })
  },
  async change(
    id: string,
    actorId: string,
    change: { data?: AccountData; isActive?: boolean; passwordHash?: string },
  ) {
    return prisma.$transaction(async (tx) => {
      // Serialize administrative changes so two requests cannot remove the last administrator.
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(183706)`
      const existing = await tx.user.findUnique({ where: { id }, include: { role: true } })
      if (!existing) throw new CustomError('User not found', 404)
      const removingAdmin =
        existing.isActive &&
        existing.role.code === 'ADMIN' &&
        (change.isActive === false || (change.data && change.data.roleId !== existing.roleId))
      if (
        removingAdmin &&
        (await tx.user.count({
          where: { isActive: true, role: { code: 'ADMIN', isActive: true } },
        })) <= 1
      ) {
        throw new CustomError('The last active administrator cannot be disabled or demoted', 409)
      }
      const fields: Prisma.UserUpdateInput = {
        isActive: change.isActive,
        passwordHash: change.passwordHash,
      }
      if (change.data) {
        if (change.data.accountType !== existing.accountType)
          throw new CustomError('Account type cannot be changed', 422)
        await ensureLoginAliases(tx, change.data, id)
        const { partnerIds, plantIds, roleId, ...values } = change.data
        if (values.username !== existing.username)
          throw new CustomError('Username cannot be changed', 422)
        Object.assign(fields, values, { role: { connect: { id: roleId } } })
        await tx.userPartner.deleteMany({ where: { userId: id } })
        await tx.userPlant.deleteMany({ where: { userId: id } })
        fields.partners = {
          create: partnerIds.map((partnerId, i) => ({ partnerId, isPrimary: i === 0 })),
        }
        fields.plants = { create: plantIds.map((plantId) => ({ plantId })) }
      }
      const user = await tx.user.update({ where: { id }, data: fields, include })
      await tx.authSession.deleteMany({ where: { userId: id } })
      await tx.accountAudit.create({
        data: {
          actorId,
          subjectId: id,
          action: change.passwordHash
            ? 'account.password_reset'
            : change.isActive !== undefined
              ? 'account.status_changed'
              : 'account.updated',
        },
      })
      return user
    })
  },
}
