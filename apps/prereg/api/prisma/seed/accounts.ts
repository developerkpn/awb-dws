import { prisma } from '../../src/config/prisma'
import { env } from '../../src/config/env'
import { hashPassword } from '../../src/lib/password'

export async function seedAccounts(
  rolesByCode: Map<string, string>,
  plantsByCode: Map<string, string>,
) {
  if (env.NODE_ENV !== 'development')
    throw new Error('Account seeding is disabled outside development')

  const adminRoleId = rolesByCode.get('ADMIN')!

  console.log('👤 Seeding default admin account...')
  const defaultPassword = 'password123'
  const defaultPasswordHash = await hashPassword(defaultPassword)

  const admins = [
    {
      username: 'admin',
      name: 'Bambang Admin HO',
      email: 'admin@kpncorp.com',
      phone: '+62 811 1234 567',
    },
    {
      username: 'ben',
      name: 'ben',
      email: 'ben@mail.com',
      phone: null,
    },
  ]

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { username: admin.username },
      update: {
        passwordHash: defaultPasswordHash,
        isActive: true,
        roleId: adminRoleId,
        sessions: { deleteMany: {} },
      },
      create: {
        ...admin,
        passwordHash: defaultPasswordHash,
        accountType: 'INTERNAL',
        roleId: adminRoleId,
        isActive: true,
      },
    })
  }

  console.log(`✅ Admin accounts seeded: ${admins.map((admin) => admin.username).join(', ')}`)

  const fixtures: {
    role: string
    username: string
    name: string
    accountType: string
    email?: string
    phone?: string
  }[] = [
    {
      role: 'LOGISTIC',
      username: 'logistic',
      name: 'Development logistics',
      accountType: 'INTERNAL',
    },
    {
      role: 'COMMERCIAL',
      username: 'commercial',
      name: 'Development commercial',
      accountType: 'INTERNAL',
    },
    {
      role: 'CUSTOMER',
      username: 'CU00010000',
      name: 'PT. JUJUR SENTOSA',
      accountType: 'PARTNER',
    },
    {
      role: 'VENDOR',
      username: 'AT21000006',
      name: 'JATIMJAYA PERKASA PT.',
      accountType: 'PARTNER',
    },
  ]

  for (const fixture of fixtures) {
    const fields = {
      passwordHash: await hashPassword(defaultPassword),
      accountType: fixture.accountType,
      roleId: rolesByCode.get(fixture.role)!,
      isActive: true,
    }

    const account = await prisma.user.upsert({
      where: { username: fixture.username },
      update: {
        ...fields,
        sessions: { deleteMany: {} },
      },
      create: {
        ...fields,
        username: fixture.username,
        name: fixture.name,
        email: fixture.email ?? null,
        phone: fixture.phone ?? null,
      },
    })

    await prisma.$transaction(async (tx) => {
      await tx.userPlant.deleteMany({
        where: { userId: account.id },
      })

      await tx.userPlant.createMany({
        data: [...plantsByCode.values()]
          .slice(0, fixture.accountType === 'PARTNER' ? 3 : 5)
          .map((plantId) => ({
            userId: account.id,
            plantId,
          })),
      })
    })
  }

  console.log(
    'Development accounts ready: admin, ben, logistic, commercial, CU00010000, AT21000006',
  )
}
