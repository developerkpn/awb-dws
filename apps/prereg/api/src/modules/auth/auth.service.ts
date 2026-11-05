import { createHash, randomBytes } from 'node:crypto'
import { CustomError } from '@awb/server-core'
import { sessionUser } from '@awb/contracts'
import { env } from '../../config/env'
import { hashPassword, verifyPassword } from '../../lib/password'
import repository from './auth.repository'
import type { loginSchema, SessionUser } from './auth.schema'
import type { z } from 'zod'

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
const dummyHash = hashPassword(randomBytes(32).toString('hex'))

type LoadedUser = NonNullable<Awaited<ReturnType<typeof repository.findUser>>>
function present(user: LoadedUser): SessionUser {
  return sessionUser.parse({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role.code,
    accountType: user.accountType,
    permissions: user.role.permissions.map((p) => p.permission.code),
  })
}

export default {
  async throttle(key: string, limit: number) {
    const bucket = Math.floor(Date.now() / 900_000)
    const expiresAt = new Date((bucket + 1) * 900_000)
    const attempts = await repository.consumeRate(tokenHash(`${key}:${bucket}`), expiresAt)

    if (attempts > limit) throw new CustomError('Too many requests. Try again later.', 429)
  },
  async login(input: z.infer<typeof loginSchema>, ip: string) {
    const bucket = Math.floor(Date.now() / 900_000)
    const expiresAt = new Date((bucket + 1) * 900_000)
    const counts = await Promise.all([
      repository.consumeRate(tokenHash(`ip:${ip}:${bucket}`), expiresAt),
      repository.consumeRate(
        tokenHash(`account:${input.username.toLowerCase()}:${bucket}`),
        expiresAt,
      ),
    ])
    if (counts[0]! > 100 || counts[1]! > 20)
      throw new CustomError('Too many login attempts. Try again later.', 429)
    const user = await repository.findUser(input.username)
    if (user) await this.throttle(`login-user:${user.id}`, 20)
    const valid = await verifyPassword(input.password, user?.passwordHash ?? (await dummyHash))
    if (!user || !valid || !user.isActive || !user.role.isActive)
      throw new CustomError('Invalid username or password', 401)
    if (
      !user.passwordHash.startsWith('$2') ||
      Number(user.passwordHash.split('$')[2]) < env.BCRYPT_ROUNDS
    ) {
      const upgraded = await repository.upgradePassword(
        user.id,
        user.passwordHash,
        await hashPassword(input.password),
      )
      if (!upgraded.count) throw new CustomError('Account changed. Please sign in again.', 401)
    }
    const token = randomBytes(32).toString('base64url')
    const lifetime = input.rememberMe
      ? env.SESSION_REMEMBER_DAYS * 86_400_000
      : env.SESSION_HOURS * 3_600_000
    const expiresAtSession = new Date(Date.now() + lifetime)
    await repository.createSession(user.id, tokenHash(token), expiresAtSession)
    await repository.audit(user.id, 'auth.login')
    return { user: present(user), token, expiresAt: expiresAtSession }
  },
  async authenticate(token: string) {
    const session = await repository.findSession(tokenHash(token))
    if (!session) return null
    if (
      session.expiresAt <= new Date() ||
      session.lastSeenAt.getTime() < Date.now() - env.SESSION_IDLE_MINUTES * 60_000 ||
      !session.user.isActive ||
      !session.user.role.isActive
    ) {
      await repository.removeSession(session.tokenHash)
      return null
    }
    if (session.lastSeenAt.getTime() < Date.now() - 60_000) await repository.touch(session.id)
    return present(session.user)
  },
  async logout(token: string) {
    await repository.removeSession(tokenHash(token))
  },
  cleanup: () => repository.cleanup(),
}
