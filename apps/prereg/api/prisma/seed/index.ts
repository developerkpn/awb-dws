import { prisma } from '../../src/config/prisma'
import { env } from '../../src/config/env'
import { seedTransporters } from './transporters'
import { seedRoles } from './roles'
import { seedPermissions } from './permissions'
import { seedPlants } from './plants'
import { seedAccounts } from './accounts'

async function main() {
  if (env.NODE_ENV !== 'development')
    throw new Error('Development seed is disabled outside development')
  await seedTransporters()
  const roles = await seedRoles()
  await seedPermissions(roles)
  const plants = await seedPlants()
  await seedAccounts(roles, plants)
  console.log('Development database seeding completed')
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Development seed failed')
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
