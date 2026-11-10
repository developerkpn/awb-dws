import { CustomError } from '@awb/server-core'
import { prisma } from '../../config/prisma'
import type { AccountSortField, SortDirection } from '@awb/contracts'
import type { Prisma } from '../../generated/prisma/client'
import type { AccountData } from '../../types/internalUser'

const include = {
  role: true,
  plants: {
    include: { plant: true },
  },
} as const

async function ensureUsername(tx: Prisma.TransactionClient, data: AccountData, id?: string) {
  const collision = await tx.user.findFirst({
    where: {
      ...(id
        ? {
            id: { not: id },
          }
        : {}),
      username: {
        equals: data.username,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  })

  if (collision) throw new CustomError('Username is already in use', 409)
}

export default {
  findRoleByCode: (code: string) =>
    prisma.role.findUnique({
      where: { code },
    }),
  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      include,
    }),
  findPlants: (ids: string[]) =>
    prisma.plant.findMany({
      where: {
        id: { in: ids },
        isActive: true,
      },
    }),
  async list(
    where: Prisma.UserWhereInput,
    page: number,
    limit: number,
    sortBy: AccountSortField,
    direction: SortDirection,
  ) {
    const order: Record<AccountSortField, Prisma.UserOrderByWithRelationInput> = {
      createdAt: { createdAt: direction },
      name: { name: direction },
      username: { username: direction },
      email: {
        email: {
          sort: direction,
          nulls: 'last',
        },
      },
      accountType: { accountType: direction },
      role: {
        role: { name: direction },
      },
      sapCode: { username: direction },
      plantAccess: {
        plants: { _count: direction },
      },
      isActive: { isActive: direction },
    }

    const orderBy: Prisma.UserOrderByWithRelationInput[] = [
      ...(['sapCode', 'plantAccess'].includes(sortBy) ? [{ accountType: 'desc' as const }] : []),
      order[sortBy],
      { id: direction },
    ]

    const [items, total] = await prisma.$transaction(
      [
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
            accountType: true,
            isActive: true,
            role: {
              select: {
                code: true,
                name: true,
              },
            },
            _count: {
              select: { plants: true },
            },
            plants: {
              take: 2,
              orderBy: [
                {
                  plant: { name: 'asc' },
                },
                { id: 'asc' },
              ],
              select: {
                plant: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where }),
      ],
      { isolationLevel: 'RepeatableRead' },
    )

    return {
      items,
      total,
      page,
      limit,
    }
  },
  async options() {
    const [roles, plants] = await Promise.all([
      prisma.role.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      }),
      prisma.plant.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
    ])

    return {
      roles,
      plants,
    }
  },
  async create(data: AccountData, passwordHash: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(183706)`
      await ensureUsername(tx, data)
      const { plantIds, ...fields } = data

      const user = await tx.user.create({
        data: {
          ...fields,
          passwordHash,
          plants: {
            create: plantIds.map((plantId) => ({ plantId })),
          },
        },
        include,
      })

      await tx.accountAudit.create({
        data: {
          actorId,
          subjectId: user.id,
          action: 'account.created',
        },
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

      const existing = await tx.user.findUnique({
        where: { id },
        include: { role: true },
      })

      if (!existing) throw new CustomError('User not found', 404)

      const removingAdmin =
        existing.isActive &&
        existing.role.code === 'ADMIN' &&
        (change.isActive === false || (change.data && change.data.roleId !== existing.roleId))

      if (
        removingAdmin &&
        (await tx.user.count({
          where: {
            isActive: true,
            role: {
              code: 'ADMIN',
              isActive: true,
            },
          },
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

        await ensureUsername(tx, change.data, id)
        const { plantIds, roleId, ...values } = change.data

        if (values.username !== existing.username)
          throw new CustomError('Username cannot be changed', 422)

        Object.assign(fields, values, {
          role: {
            connect: { id: roleId },
          },
        })

        await tx.userPlant.deleteMany({
          where: { userId: id },
        })

        fields.plants = {
          create: plantIds.map((plantId) => ({ plantId })),
        }
      }

      const user = await tx.user.update({
        where: { id },
        data: fields,
        include,
      })

      await tx.authSession.deleteMany({
        where: { userId: id },
      })

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
