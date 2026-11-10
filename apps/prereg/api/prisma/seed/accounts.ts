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

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: defaultPasswordHash,
      isActive: true,
      roleId: adminRoleId,
      sessions: { deleteMany: {} },
    },
    create: {
      name: 'Bambang Admin HO',
      username: 'admin',
      email: 'admin@kpncorp.com',
      phone: '+62 811 1234 567',
      passwordHash: defaultPasswordHash,
      accountType: 'INTERNAL',
      roleId: adminRoleId,
      isActive: true,
    },
  })

  console.log(`✅ Admin account seeded: ${adminUser.username}`)

  const fixtures = [
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
      username: 'CU00001000',
      name: 'Development customer',
      accountType: 'PARTNER',
    },
    {
      role: 'CUSTOMER',
      username: 'CU00010000',
      name: 'PT. JUJUR SENTOSA',
      accountType: 'PARTNER',
    },
    {
      role: 'VENDOR',
      username: 'AT11000001',
      name: 'Development vendor',
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
    'Development accounts ready: admin, logistic, commercial, CU00001000, CU00010000, AT11000001',
  )
}
