import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import app from '../src/app'
import { env } from '../src/config/env'
import { prisma } from '../src/config/prisma'
import { verifyPassword } from '../src/lib/password'
import { createTestUser, sessionFor, origin, login, cookieFrom } from './helpers'

const newAccount = () => ({
  name: 'New internal account',
  username: `new_${randomUUID()}`,
  email: '',
  phone: '',
  accountType: 'INTERNAL',
  role: 'LOGISTIC',
  plantIds: [],
})

describe('Account administration', () => {
  it('requires a real administrator session, regardless of supplied role header', async () => {
    const { cookie } = await sessionFor('CUSTOMER')

    const response = await request(app)
      .get('/api/users')
      .set('Cookie', cookie)
      .set('x-user-role', 'ADMIN')

    expect(response.status).toBe(403)
  })

  it('creates and resets accounts with bcrypt; credentials appear only in the development console', async () => {
    const { cookie } = await sessionFor()

    await createTestUser('LOGISTIC')
    const log = vi.spyOn(console, 'info').mockImplementation(() => {})
    const original = env.NODE_ENV

    env.NODE_ENV = 'development'

    try {
      const data = newAccount()

      const response = await request(app)
        .post('/api/users')
        .set('Origin', origin)
        .set('Cookie', cookie)
        .send(data)

      expect(response.status).toBe(201)
      expect(response.body.data).not.toHaveProperty('temporaryPassword')
      const firstPassword = (log.mock.calls.at(-1)![1] as { password: string }).password

      const user = await prisma.user.findUniqueOrThrow({
        where: { username: data.username },
      })

      expect(await verifyPassword(firstPassword, user.passwordHash)).toBe(true)
      const oldCookie = cookieFrom(await login(data.username, firstPassword))

      const reset = await request(app)
        .post(`/api/users/${user.id}/reset-password`)
        .set('Origin', origin)
        .set('Cookie', cookie)

      expect(reset.status).toBe(200)
      const nextPassword = (log.mock.calls.at(-1)![1] as { password: string }).password

      expect(nextPassword).not.toBe(firstPassword)
      expect((await login(data.username, firstPassword)).status).toBe(401)
      expect((await login(data.username, nextPassword)).status).toBe(200)
      expect((await request(app).get('/api/auth/me').set('Cookie', oldCookie)).status).toBe(401)

      expect(
        await prisma.accountAudit.count({
          where: { subjectId: user.id },
        }),
      ).toBeGreaterThanOrEqual(2)
    } finally {
      env.NODE_ENV = original
      log.mockRestore()
    }
  })

  it('blocks production provisioning and reset before modifying data or logging secrets', async () => {
    const { cookie } = await sessionFor()
    const target = await createTestUser('LOGISTIC')
    const log = vi.spyOn(console, 'info').mockImplementation(() => {})
    const original = env.NODE_ENV

    env.NODE_ENV = 'production'

    try {
      const data = newAccount()

      expect(
        (
          await request(app)
            .post('/api/users')
            .set('Origin', origin)
            .set('Cookie', cookie)
            .send(data)
        ).status,
      ).toBe(503)

      expect(
        (
          await request(app)
            .post(`/api/users/${target.id}/reset-password`)
            .set('Origin', origin)
            .set('Cookie', cookie)
        ).status,
      ).toBe(503)

      expect(
        await prisma.user.findUnique({
          where: { username: data.username },
        }),
      ).toBeNull()

      expect(
        (
          await prisma.user.findUniqueOrThrow({
            where: { id: target.id },
          })
        ).passwordHash,
      ).toBe(target.passwordHash)

      expect(log).not.toHaveBeenCalled()
    } finally {
      env.NODE_ENV = original
      log.mockRestore()
    }
  })

  it('persists edits and deactivation and revokes affected sessions', async () => {
    const admin = await sessionFor()
    const target = await sessionFor('LOGISTIC')

    const data = {
      ...newAccount(),
      username: target.user.username,
      name: 'Updated account',
    }

    const update = await request(app)
      .put(`/api/users/${target.user.id}`)
      .set('Origin', origin)
      .set('Cookie', admin.cookie)
      .send(data)

    expect(update.status).toBe(200)

    expect(
      (
        await prisma.user.findUniqueOrThrow({
          where: { id: target.user.id },
        })
      ).name,
    ).toBe('Updated account')

    expect((await request(app).get('/api/auth/me').set('Cookie', target.cookie)).status).toBe(401)

    expect(
      (
        await request(app)
          .patch(`/api/users/${target.user.id}/status`)
          .set('Origin', origin)
          .set('Cookie', admin.cookie)
          .send({ isActive: false })
      ).status,
    ).toBe(200)

    expect((await login(target.user.username)).status).toBe(401)
  })

  it('rejects duplicates atomically and validates account and role combinations', async () => {
    const { cookie } = await sessionFor()
    const target = await createTestUser('LOGISTIC')

    const data = {
      ...newAccount(),
      username: target.username.toUpperCase(),
    }

    expect(
      (await request(app).post('/api/users').set('Origin', origin).set('Cookie', cookie).send(data))
        .status,
    ).toBe(409)

    expect(
      (
        await request(app)
          .post('/api/users')
          .set('Origin', origin)
          .set('Cookie', cookie)
          .send({
            ...data,
            accountType: 'PARTNER',
          })
      ).status,
    ).toBe(422)
  })

  it('bounds list sizes and filters without returning password hashes', async () => {
    const { user, cookie } = await sessionFor()

    const result = await request(app)
      .get(`/api/users?q=${user.username}&limit=1`)
      .set('Cookie', cookie)

    expect(result.body.data.total).toBe(1)
    expect(result.body.data.items).toHaveLength(1)
    expect(result.body.data.items[0]).not.toHaveProperty('passwordHash')

    expect((await request(app).get('/api/users?limit=100000').set('Cookie', cookie)).status).toBe(
      422,
    )
  })

  it('keeps at least one active administrator', async () => {
    const { user, cookie } = await sessionFor()

    const others = await prisma.user.findMany({
      where: {
        role: { code: 'ADMIN' },
        isActive: true,
        id: { not: user.id },
      },
      select: { id: true },
    })

    await prisma.user.updateMany({
      where: {
        id: {
          in: others.map((item) => item.id),
        },
      },
      data: { isActive: false },
    })

    try {
      const result = await request(app)
        .patch(`/api/users/${user.id}/status`)
        .set('Origin', origin)
        .set('Cookie', cookie)
        .send({ isActive: false })

      expect(result.status).toBe(409)

      expect(
        (
          await prisma.user.findUniqueOrThrow({
            where: { id: user.id },
          })
        ).isActive,
      ).toBe(true)
    } finally {
      await prisma.user.updateMany({
        where: {
          id: {
            in: others.map((item) => item.id),
          },
        },
        data: { isActive: true },
      })
    }
  })
})
