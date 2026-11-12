import { prisma } from '../src/config/prisma'
import { env } from '../src/config/env'
import { hashPassword } from '../src/lib/password'

const ACCOUNTS = [
  {
    username: 'admin',
    name: 'Administrator',
    role: 'ADMIN',
  },
  {
    username: 'operator',
    name: 'Operator Gerbang',
    role: 'OPERATOR',
  },
]

async function main() {
  if (env.NODE_ENV !== 'development')
    throw new Error('Development seed is disabled outside development')

  const passwordHash = await hashPassword('password123')

  for (const account of ACCOUNTS) {
    await prisma.user.upsert({
      where: { username: account.username },
      create: {
        ...account,
        passwordHash,
      },
      update: {
        name: account.name,
        role: account.role,
        isActive: true,
      },
    })
  }

  console.log('Development accounts ready: admin, operator (password123)')
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Development seed failed')
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
