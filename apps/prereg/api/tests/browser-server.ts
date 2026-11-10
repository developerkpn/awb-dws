import { existsSync } from 'node:fs'

if (process.env.NODE_ENV !== 'test') throw new Error('Browser server is test-only')

if (existsSync('.env.test')) process.loadEnvFile('.env.test')

const database = new URL(process.env.DATABASE_URL ?? '')

if (
  !database.pathname.endsWith('_test') ||
  !['localhost', '127.0.0.1'].includes(database.hostname)
) {
  throw new Error('Browser tests require a local *_test database')
}

const { prisma } = await import('../src/config/prisma')
const { hashPassword } = await import('../src/lib/password')
const { default: app } = await import('../src/app')
const { installSapMock, seedTestJulRules } = await import('./sap-mock')

installSapMock()

const role = await prisma.role.upsert({
  where: { code: 'ADMIN' },
  create: {
    code: 'ADMIN',
    name: 'Administrator',
  },
  update: { isActive: true },
})

await prisma.role.upsert({
  where: { code: 'LOGISTIC' },
  create: {
    code: 'LOGISTIC',
    name: 'Logistic',
  },
  update: { isActive: true },
})

const data = {
  name: 'Browser test administrator',
  passwordHash: await hashPassword('Browser-Only-Password-123!'),
  accountType: 'INTERNAL',
  roleId: role.id,
  isActive: true,
}

await prisma.user.upsert({
  where: { username: 'browser_test_admin' },
  create: {
    ...data,
    username: 'browser_test_admin',
  },
  update: data,
})

await prisma.authRateLimit.deleteMany()

const partnerRole = await prisma.role.upsert({
  where: { code: 'CUSTOMER' },
  create: {
    code: 'CUSTOMER',
    name: 'Customer',
  },
  update: { isActive: true },
})

const browserCustomer = await prisma.user.upsert({
  where: { username: 'browser_test_customer' },
  create: {
    ...data,
    username: 'browser_test_customer',
    name: 'Browser test customer',
    accountType: 'PARTNER',
    roleId: partnerRole.id,
  },
  update: {
    ...data,
    accountType: 'PARTNER',
    roleId: partnerRole.id,
  },
})

await prisma.plant.upsert({
  where: { code: 'E2E-PLANT' },
  create: {
    code: 'E2E-PLANT',
    name: 'Browser test plant',
  },
  update: { isActive: true },
})

await prisma.plant.upsert({
  where: { code: 'E2E-SECONDARY-PLANT' },
  create: {
    code: 'E2E-SECONDARY-PLANT',
    name: 'Browser secondary plant',
  },
  update: { isActive: true },
})

const accessPlants = []

for (let index = 0; index < 25; index += 1) {
  accessPlants.push(
    await prisma.plant.upsert({
      where: { code: `E2E-ACCESS-${String(index).padStart(2, '0')}` },
      create: {
        code: `E2E-ACCESS-${String(index).padStart(2, '0')}`,
        name: `Browser access plant ${String(index).padStart(2, '0')}`,
      },
      update: { isActive: true },
    }),
  )
}

await prisma.userPlant.createMany({
  data: accessPlants.map((plant) => ({
    userId: browserCustomer.id,
    plantId: plant.id,
  })),
  skipDuplicates: true,
})

const julPlant = await prisma.plant.upsert({
  where: { code: 'PRISCOLIN_KARAWANG' },
  create: {
    code: 'PRISCOLIN_KARAWANG',
    name: 'Browser JUL plant',
    sapPlantCode: '3701',
    companyGroup: 'DOWNSTREAM',
  },
  update: {
    isActive: true,
    sapPlantCode: '3701',
    companyGroup: 'DOWNSTREAM',
  },
})

await seedTestJulRules(julPlant.id)

const julCustomer = await prisma.user.upsert({
  where: { username: 'browser_test_jul_customer' },
  create: {
    ...data,
    username: 'browser_test_jul_customer',
    name: 'Browser JUL customer',
    accountType: 'PARTNER',
    roleId: partnerRole.id,
  },
  update: {
    ...data,
    accountType: 'PARTNER',
    roleId: partnerRole.id,
  },
})

await prisma.userPlant.deleteMany({
  where: {
    userId: browserCustomer.id,
    plantId: julPlant.id,
  },
})

const logisticRole = await prisma.role.findUniqueOrThrow({
  where: { code: 'LOGISTIC' },
})

const logistic = await prisma.user.upsert({
  where: { username: 'browser_test_logistic' },
  create: {
    ...data,
    username: 'browser_test_logistic',
    name: 'Browser test Logistics',
    roleId: logisticRole.id,
  },
  update: {
    ...data,
    roleId: logisticRole.id,
  },
})

await prisma.userPlant.createMany({
  data: [julCustomer, logistic].map((user) => ({
    userId: user.id,
    plantId: julPlant.id,
  })),
  skipDuplicates: true,
})

const vendorRole = await prisma.role.upsert({
  where: { code: 'VENDOR' },
  create: {
    code: 'VENDOR',
    name: 'Vendor',
  },
  update: { isActive: true },
})

await prisma.user.upsert({
  where: { username: 'browser_test_vendor' },
  create: {
    ...data,
    username: 'browser_test_vendor',
    name: 'Browser test vendor',
    accountType: 'PARTNER',
    roleId: vendorRole.id,
  },
  update: {
    ...data,
    accountType: 'PARTNER',
    roleId: vendorRole.id,
  },
})

for (const [roleId, codes] of [
  [partnerRole.id, ['prereg:read', 'prereg:create', 'prereg:update']],
  [vendorRole.id, ['prereg:read', 'prereg:create', 'prereg:update']],
  [logisticRole.id, ['prereg:read', 'prereg:approve', 'documents:read']],
] as const) {
  for (const code of codes) {
    const permission = await prisma.permission.upsert({
      where: { code },
      create: {
        code,
        name: code,
        module: 'prereg',
      },
      update: {},
    })

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permission.id,
        },
      },
      create: {
        roleId,
        permissionId: permission.id,
      },
      update: {},
    })
  }
}

const priorJul = await prisma.julRegistration.findMany({
  where: { customerId: julCustomer.id },
  select: { id: true },
})

const priorIds = priorJul.map((row) => row.id)

await prisma.julLine.deleteMany({
  where: {
    registrationId: { in: priorIds },
  },
})

await prisma.julJob.deleteMany({
  where: {
    registrationId: { in: priorIds },
  },
})

await prisma.julRegistration.deleteMany({
  where: {
    id: { in: priorIds },
  },
})

const server = app.listen(3001, '127.0.0.1')

const stop = () => {
  server.close(() => void prisma.$disconnect().finally(() => process.exit(0)))
}

process.on('SIGTERM', stop)
process.on('SIGINT', stop)
