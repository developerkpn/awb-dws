import { prisma } from '../../config/prisma'
import { env } from '../../config/env'

const userInclude = {
  role: { include: { permissions: { include: { permission: true } } } },
} as const

export default {
  findUser(username: string) {
    return prisma.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
      },
      include: userInclude,
    })
  },
  createSession(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.authSession.create({ data: { userId, tokenHash, expiresAt } })
  },
  findSession(tokenHash: string) {
    return prisma.authSession.findUnique({
      where: { tokenHash },
      include: { user: { include: userInclude } },
    })
  },
  touch(id: string) {
    return prisma.authSession.updateMany({ where: { id }, data: { lastSeenAt: new Date() } })
  },
  removeSession(tokenHash: string) {
    return prisma.authSession.deleteMany({ where: { tokenHash } })
  },
  async upgradePassword(id: string, oldHash: string, passwordHash: string) {
    return prisma.user.updateMany({ where: { id, passwordHash: oldHash }, data: { passwordHash } })
  },
  async consumeRate(key: string, expiresAt: Date) {
    const rate = await prisma.authRateLimit.upsert({
      where: { key },
      create: { key, expiresAt },
      update: { attempts: { increment: 1 } },
    })
    return rate.attempts
  },
  async cleanup() {
    const now = new Date()
    const idleBefore = new Date(Date.now() - env.SESSION_IDLE_MINUTES * 60_000)

    await prisma.$executeRaw`
      WITH expired AS (
        SELECT id FROM auth_rate_limit WHERE expires_at < ${now}
        LIMIT 1000 FOR UPDATE SKIP LOCKED
      )
      DELETE FROM auth_rate_limit USING expired WHERE auth_rate_limit.id = expired.id
    `
    await prisma.$executeRaw`
      WITH expired AS (
        SELECT id FROM auth_session WHERE expires_at < ${now} OR last_seen_at < ${idleBefore}
        LIMIT 1000 FOR UPDATE SKIP LOCKED
      )
      DELETE FROM auth_session USING expired WHERE auth_session.id = expired.id
    `
  },
  audit(actorId: string, action: string) {
    return prisma.accountAudit.create({ data: { actorId, subjectId: actorId, action } })
  },
}
