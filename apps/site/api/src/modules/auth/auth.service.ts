import { createHash, randomBytes } from 'node:crypto'
import { CustomError } from '@awb/server-core'
import { operatorSession, type OperatorLoginData, type OperatorSession } from '@awb/contracts'
import { env } from '../../config/env'
import type { User } from '../../generated/prisma/client'
import { hashPassword, verifyPassword } from '../../lib/password'
import { consumeAttempt } from '../../lib/rate-limit'
import repository from './auth.repository'

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')

// Unknown usernames still pay for one bcrypt comparison, so timing does not reveal them.
const dummyHash = hashPassword(randomBytes(32).toString('hex'))

const present = (user: User): OperatorSession =>
  operatorSession.parse({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  })

export default {
  async login(input: OperatorLoginData, ip: string) {
    const attempts = [
      consumeAttempt(`ip:${ip}`) > 100,
      consumeAttempt(`account:${input.username.toLowerCase()}`) > 20,
    ]

    if (attempts.some(Boolean)) {
      throw new CustomError('Too many login attempts. Try again later.', 429)
    }

    const user = await repository.findUser(input.username)
    const valid = await verifyPassword(input.password, user?.passwordHash ?? (await dummyHash))

    if (!user || !valid || !user.isActive) {
      throw new CustomError('Invalid username or password', 401)
    }

    const token = randomBytes(32).toString('base64url')

    const lifetime = input.rememberMe
      ? env.SESSION_REMEMBER_DAYS * 86_400_000
      : env.SESSION_HOURS * 3_600_000

    const expiresAt = new Date(Date.now() + lifetime)

    await repository.createSession(user.id, tokenHash(token), expiresAt)

    return {
      user: present(user),
      token,
      expiresAt,
    }
  },
  async authenticate(token: string) {
    const session = await repository.findSession(tokenHash(token))

    if (!session) return null

    if (
      session.expiresAt <= new Date() ||
      session.lastSeenAt.getTime() < Date.now() - env.SESSION_IDLE_MINUTES * 60_000 ||
      !session.user.isActive
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
}
