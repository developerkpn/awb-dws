import { createHash, randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { env } from '../src/config/env'
import { hashPassword, verifyPassword } from '../src/lib/password'
import { tokenHash } from '../src/modules/auth/auth.service'
import { createTestUser, sessionFor, login, origin, password, cookieFrom } from './helpers'

describe('Authenticated sessions', () => {
  it('uses salted bcrypt and rejects passwords over 72 bytes', async () => {
    const first = await hashPassword(password)
    const second = await hashPassword(password)

    expect(first).toMatch(/^\$2[ab]\$/)
    expect(first).not.toBe(second)
    expect(await verifyPassword(password, first)).toBe(true)
    expect(await verifyPassword('wrong', first)).toBe(false)
    await expect(hashPassword('é'.repeat(37))).rejects.toThrow(/72/)
  })

  it('issues an HTTP-only cookie, stores only its digest, and restores the current user', async () => {
    const user = await createTestUser()
    const response = await login(user.username.toUpperCase())
    const cookie = cookieFrom(response)
    const token = cookie.split('=')[1]!

    expect(response.status).toBe(200)
    expect(response.body.data).not.toHaveProperty('token')
    expect(response.body.data.user).not.toHaveProperty('passwordHash')
    expect(String(response.headers['set-cookie'])).toContain('HttpOnly')
    expect(String(response.headers['set-cookie'])).toContain('SameSite=Lax')
    expect(String(response.headers['set-cookie'])).toContain('Path=/api')

    expect(
      await prisma.authSession.findUnique({
        where: {
          tokenHash: tokenHash(token),
        },
      }),
    ).not.toBeNull()

    const restored = await request(app).get('/api/auth/me').set('Cookie', cookie)

    expect(restored.body.data.user.id).toBe(user.id)
  })

  it('ignores forged roles and rejects absent, malformed or unknown sessions', async () => {
    for (const path of ['/api/auth/me', '/api/users', '/api/access/roles']) {
      expect((await request(app).get(path).set('x-user-role', 'ADMIN')).status).toBe(401)
      expect((await request(app).get(path).set('Cookie', 'awb_session=forged')).status).toBe(401)

      expect(
        (
          await request(app)
            .get(path)
            .set('Cookie', `awb_session=${'a'.repeat(43)}`)
        ).status,
      ).toBe(401)
    }
  })

  it('rejects cross-origin writes and missing origin, including login', async () => {
    const user = await createTestUser()

    const body = {
      username: user.username,
      password,
    }

    expect((await request(app).post('/api/auth/login').send(body)).status).toBe(403)

    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .set('Origin', 'https://untrusted.invalid')
          .send(body)
      ).status,
    ).toBe(403)
  })

  it('revokes a copied token on logout', async () => {
    const { cookie } = await sessionFor()

    const result = await request(app)
      .post('/api/auth/logout')
      .set('Origin', origin)
      .set('Cookie', cookie)

    expect(result.status).toBe(204)
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401)
  })

  it('rejects expired and idle sessions', async () => {
    for (const data of [
      {
        expiresAt: new Date(Date.now() - 1000),
      },
      {
        lastSeenAt: new Date(Date.now() - (env.SESSION_IDLE_MINUTES + 1) * 60_000),
      },
    ]) {
      const { user, cookie } = await sessionFor()

      await prisma.authSession.updateMany({
        where: { userId: user.id },
        data,
      })

      expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401)
    }
  })

  it('rejects inactive accounts and disabled roles even with an existing session', async () => {
    const { user, cookie } = await sessionFor('TEST_DISABLED')

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    })

    expect((await login(user.username)).status).toBe(401)
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401)

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true },
    })

    const next = cookieFrom(await login(user.username))

    await prisma.role.update({
      where: { id: user.roleId },
      data: { isActive: false },
    })

    expect((await request(app).get('/api/auth/me').set('Cookie', next)).status).toBe(401)
  })

  it('supports an explicit transition from SHA-256 to bcrypt, disabled by default', async () => {
    const user = await createTestUser()
    const legacy = createHash('sha256').update(password).digest('hex')

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: legacy },
    })

    expect((await login(user.username)).status).toBe(401)
    env.ALLOW_LEGACY_PASSWORDS = 'true'

    try {
      expect((await login(user.username)).status).toBe(200)

      const updated = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
      })

      expect(updated.passwordHash).toMatch(/^\$2/)
    } finally {
      env.ALLOW_LEGACY_PASSWORDS = 'false'
    }
  })

  it('shares the account attempt limit across requests', async () => {
    const username = `missing_${randomUUID()}`

    for (let count = 0; count < 20; count++) {
      expect((await login(username, 'invalid')).status).toBe(401)
    }

    expect((await login(username, 'invalid')).status).toBe(429)
  })

  it('marks self-service recovery unavailable', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .set('Origin', origin)
      .send({ username: 'unknown' })

    expect(response.status).toBe(404)
  })
})
