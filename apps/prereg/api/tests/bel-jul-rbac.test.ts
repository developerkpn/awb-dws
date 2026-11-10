import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { cookieFrom, createTestUser, grant, login, sessionFor } from './helpers'

describe('BEL and JUL RBAC role restrictions (AWB-20)', () => {
  const users: string[] = []

  let customerCookie: string
  let vendorCookie: string
  let adminCookie: string
  let logisticCookie: string

  beforeAll(async () => {
    // 1. Customer user
    const customer = await createTestUser('CUSTOMER')

    users.push(customer.id)
    await grant(customer.role.id, 'prereg:read')
    customerCookie = cookieFrom(await login(customer.username))

    // 2. Vendor user
    const vendor = await createTestUser('VENDOR')

    users.push(vendor.id)
    await grant(vendor.role.id, 'prereg:read')
    vendorCookie = cookieFrom(await login(vendor.username))

    // 3. Admin user
    const admin = await sessionFor('ADMIN')

    adminCookie = admin.cookie
    users.push(admin.user.id)

    // 4. Logistic user
    const logistic = await createTestUser('LOGISTIC')

    users.push(logistic.id)
    await grant(logistic.role.id, 'prereg:read')
    await grant(logistic.role.id, 'prereg:approve')
    logisticCookie = cookieFrom(await login(logistic.username))
  })

  afterAll(async () => {
    if (users.length) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: users,
          },
        },
      })
    }
  })

  it('rejects vendor from accessing JUL endpoints with 403 Forbidden', async () => {
    const res = await request(app).get('/api/jul/configuration').set('Cookie', vendorCookie)

    expect(res.status).toBe(403)
  })

  it('allows customer to access JUL endpoints', async () => {
    const res = await request(app).get('/api/jul/configuration').set('Cookie', customerCookie)

    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
  })

  it('rejects customer from accessing BEL endpoints with 403 Forbidden', async () => {
    const res = await request(app).get('/api/bel/configuration').set('Cookie', customerCookie)

    expect(res.status).toBe(403)
  })

  it('allows vendor to access BEL endpoints', async () => {
    const res = await request(app).get('/api/bel/configuration').set('Cookie', vendorCookie)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ role: 'VENDOR' })
  })

  it('allows internal staff (ADMIN and LOGISTIC) to access both JUL and BEL endpoints', async () => {
    // Admin
    const adminJul = await request(app).get('/api/jul/configuration').set('Cookie', adminCookie)
    const adminBel = await request(app).get('/api/bel/configuration').set('Cookie', adminCookie)

    expect(adminJul.status).toBe(200)
    expect(adminBel.status).toBe(200)

    // Logistic
    const logisticJul = await request(app)
      .get('/api/jul/configuration')
      .set('Cookie', logisticCookie)

    const logisticBel = await request(app)
      .get('/api/bel/configuration')
      .set('Cookie', logisticCookie)

    expect(logisticJul.status).toBe(200)
    expect(logisticBel.status).toBe(200)
  })
})
