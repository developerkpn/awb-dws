import { CustomError, NotFoundError } from '@awb/server-core'
import { accountListItem, accountProfile } from '@awb/contracts'
import { hashPassword, generatePassword } from '../../lib/password'
import { deliverCredentials, requireCredentialDelivery } from '../../services/mailer'
import repository from './internal-user.repository'
import { accountFiltersWhere } from './internal-user.filters'
import type { listUsersSchema } from './internal-user.schema'
import type { Prisma } from '../../generated/prisma/client'
import type { z } from 'zod'
import type { InternalUserRecord } from '../../types/internalUser'
import type { AccountInput } from '../../types/internalUser'

export function formatUserResponse(user: InternalUserRecord) {
  const { passwordHash: _password, roleId: _roleId, role, plants, ...data } = user

  return accountProfile.parse({
    ...data,
    role: role.code,
    roleName: role.name,
    plantAccess: plants.map((p) => ({
      id: p.plant.id,
      code: p.plant.code,
      name: p.plant.name,
    })),
  })
}

async function resolveAccount(input: AccountInput) {
  const [role, plants] = await Promise.all([
    repository.findRoleByCode(input.role),
    repository.findPlants(input.plantIds),
  ])

  if (!role?.isActive) throw new CustomError('Role is unavailable', 422)

  if (plants.length !== input.plantIds.length)
    throw new CustomError('One or more plants are unavailable', 422)

  const { role: _code, ...data } = input

  return {
    ...data,
    roleId: role.id,
  }
}

async function write<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002')
      throw new CustomError('Username or email is already in use', 409)

    throw error
  }
}

export default {
  async list(query: z.infer<typeof listUsersSchema>) {
    const where: Prisma.UserWhereInput = {
      AND: [
        accountFiltersWhere(query.filters),
        ...(query.roles.length
          ? [
              {
                role: {
                  code: { in: query.roles },
                },
              },
            ]
          : []),
        ...(query.plantIds.length
          ? [
              {
                plants: {
                  some: {
                    plantId: { in: query.plantIds },
                  },
                },
              },
            ]
          : []),
      ],
      accountType: query.accountType,
      role: query.role ? { code: query.role } : undefined,
      ...(query.plantId
        ? {
            plants: {
              some: { plantId: query.plantId },
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              {
                name: {
                  contains: query.q,
                  mode: 'insensitive',
                },
              },
              {
                username: {
                  contains: query.q,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query.q,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    }

    const result = await repository.list(
      where,
      query.page,
      query.limit,
      query.sortBy,
      query.sortDirection,
    )

    return {
      ...result,
      items: result.items.map(({ role, plants, _count, ...user }) =>
        accountListItem.parse({
          ...user,
          role: role.code,
          roleName: role.name,
          plantCount: _count.plants,
          plantPreview: plants.map((link) => link.plant),
        }),
      ),
    }
  },
  options: () => repository.options(),
  async getById(id: string) {
    const user = await repository.findById(id)

    if (!user) throw new NotFoundError('InternalUserRecord not found')

    return formatUserResponse(user)
  },
  async create(input: AccountInput, actorId: string) {
    requireCredentialDelivery()
    const data = await resolveAccount(input)
    const password = generatePassword()
    const passwordHash = await hashPassword(password)
    const user = await write(() => repository.create(data, passwordHash, actorId))

    deliverCredentials(user.username, password)

    return {
      user: formatUserResponse(user),
      message: 'Account created. Credentials are available in the local development console.',
    }
  },
  async update(id: string, input: AccountInput, actorId: string) {
    const existing = await repository.findById(id)

    if (!existing) throw new NotFoundError('InternalUserRecord not found')

    const data = await resolveAccount(input)

    return formatUserResponse(await write(() => repository.change(id, actorId, { data })))
  },
  async setStatus(id: string, isActive: boolean, actorId: string) {
    return formatUserResponse(await repository.change(id, actorId, { isActive }))
  },
  async resetPassword(id: string, actorId: string) {
    requireCredentialDelivery()
    const password = generatePassword()

    const user = await repository.change(id, actorId, {
      passwordHash: await hashPassword(password),
    })

    deliverCredentials(user.username, password)

    return {
      message: 'Password reset. Credentials are available in the local development console.',
    }
  },
}
