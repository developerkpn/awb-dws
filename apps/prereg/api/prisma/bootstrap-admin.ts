import { prisma } from '../src/config/prisma'
import { hashPassword } from '../src/lib/password'

async function main() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim()
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD

  if (
    !username ||
    !/^[a-zA-Z0-9_.@-]{3,100}$/.test(username) ||
    !password ||
    password.length < 12
  ) {
    throw new Error(
      'Set BOOTSTRAP_ADMIN_USERNAME and a password of at least 12 characters through the deployment secret mechanism',
    )
  }

  const passwordHash = await hashPassword(password)

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(183706)`

    if (await tx.user.count({ where: { role: { code: 'ADMIN' }, isActive: true } })) {
      throw new Error('An active administrator already exists; bootstrap stopped')
    }

    const role = await tx.role.upsert({
      where: { code: 'ADMIN' },
      create: { code: 'ADMIN', name: 'Administrator' },
      update: { isActive: true },
    })
    const user = await tx.user.create({
      data: {
        name: 'Administrator',
        username,
        passwordHash,
        accountType: 'INTERNAL',
        roleId: role.id,
      },
    })

    await tx.accountAudit.create({
      data: { actorId: user.id, subjectId: user.id, action: 'account.bootstrapped' },
    })
  })

  console.info('Initial administrator created. Credentials were not logged.')
}

main()
  .catch(() => {
    console.error(
      'Administrator bootstrap failed. Check configuration and whether an administrator already exists.',
    )
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
