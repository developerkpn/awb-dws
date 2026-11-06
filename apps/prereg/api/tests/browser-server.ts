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
const role = await prisma.role.upsert({
  where: { code: 'ADMIN' },
  create: { code: 'ADMIN', name: 'Administrator' },
  update: { isActive: true },
})

await prisma.role.upsert({
  where: { code: 'LOGISTIC' },
  create: { code: 'LOGISTIC', name: 'Logistic' },
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
  create: { ...data, username: 'browser_test_admin' },
  update: data,
})
await prisma.authRateLimit.deleteMany()

const partnerRole = await prisma.role.upsert({
  where: { code: 'CUSTOMER' },
  create: { code: 'CUSTOMER', name: 'Customer' },
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
  update: { ...data, accountType: 'PARTNER', roleId: partnerRole.id },
})

await prisma.plant.upsert({
  where: { code: 'E2E-PLANT' },
  create: { code: 'E2E-PLANT', name: 'Browser test plant' },
  update: { isActive: true },
})
await prisma.plant.upsert({
  where: { code: 'E2E-SECONDARY-PLANT' },
  create: { code: 'E2E-SECONDARY-PLANT', name: 'Browser secondary plant' },
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
  data: accessPlants.map((plant) => ({ userId: browserCustomer.id, plantId: plant.id })),
  skipDuplicates: true,
})

const server = app.listen(3001, '127.0.0.1')
const stop = () => {
  server.close(() => void prisma.$disconnect().finally(() => process.exit(0)))
}

process.on('SIGTERM', stop)
process.on('SIGINT', stop)
