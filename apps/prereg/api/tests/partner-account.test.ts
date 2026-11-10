import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'
import app from '../src/app'
import { hashPassword } from '../src/lib/password'
import { cookieFrom, grant, login, origin, password, sessionFor } from './helpers'

describe('Unified partner login accounts', () => {
  it('creates a SAP-code login directly with plant access and case-insensitive uniqueness', async () => {
    const admin = await sessionFor()
    const customer = await sessionFor('CUSTOMER')

    const plant = await prisma.plant.create({
      data: {
        code: randomUUID(),
        name: 'Partner plant',
      },
    })

    const input = {
      name: 'Manual customer',
      username: `SAP-${randomUUID()}`,
      accountType: 'PARTNER',
      role: 'CUSTOMER',
      city: 'Jakarta',
      country: 'ID',
      plantIds: [plant.id],
    }

    const create = (data: object) =>
      request(app).post('/api/users').set('Cookie', admin.cookie).set('Origin', origin).send(data)

    const response = await create(input)

    expect(response.status).toBe(201)
    const account = response.body.data.user

    expect(account).toMatchObject({
      username: input.username,
      accountType: 'PARTNER',
      city: 'Jakarta',
      country: 'ID',
      email: null,
    })

    expect(account.plantAccess[0].id).toBe(plant.id)
    expect(account).not.toHaveProperty('partners')

    await prisma.user.update({
      where: { id: account.id },
      data: {
        passwordHash: await hashPassword(password),
      },
    })

    expect((await login(input.username.toLowerCase())).status).toBe(200)

    expect(
      (
        await create({
          ...input,
          username: input.username.toLowerCase(),
        })
      ).status,
    ).toBe(409)

    await grant(customer.user.roleId, 'prereg:read')
    const own = cookieFrom(await login(input.username))

    expect((await request(app).get('/api/users').set('Cookie', own)).status).toBe(403)
    const { city: _city, country: _country, ...profile } = input

    const updated = await request(app)
      .put(`/api/users/${account.id}`)
      .set('Cookie', admin.cookie)
      .set('Origin', origin)
      .send({
        ...profile,
        name: 'Updated customer',
      })

    expect(updated.status).toBe(200)

    expect(updated.body.data).toMatchObject({
      name: 'Updated customer',
      username: input.username,
      city: 'Jakarta',
      country: 'ID',
    })

    expect(updated.body.data.plantAccess).toHaveLength(1)

    const renamed = await request(app)
      .put(`/api/users/${account.id}`)
      .set('Cookie', admin.cookie)
      .set('Origin', origin)
      .send({
        ...profile,
        username: `other-${randomUUID()}`,
      })

    expect(renamed.status).toBe(422)
  })

  it('creates vendors without a separate SAP master record', async () => {
    const admin = await sessionFor()

    await sessionFor('VENDOR')

    const response = await request(app)
      .post('/api/users')
      .set('Cookie', admin.cookie)
      .set('Origin', origin)
      .send({
        name: 'Manual vendor',
        username: `VENDOR-${randomUUID()}`,
        accountType: 'PARTNER',
        role: 'VENDOR',
      })

    expect(response.status).toBe(201)
    expect(response.body.data.user.role).toBe('VENDOR')
    expect(response.body.data.user.plantAccess).toEqual([])
  })

  it('rejects retired roles, mismatched account types, legacy links and unavailable plants', async () => {
    const admin = await sessionFor()

    const input = {
      name: 'Invalid account',
      username: `SAP-${randomUUID()}`,
      accountType: 'PARTNER',
      role: 'CUSTOMER',
    }

    for (const override of [
      { role: 'ADMIN' },
      { accountType: 'INTERNAL' },
      { role: 'INTERCO' },
      { role: 'KRANIWB' },
      {
        partnerIds: [randomUUID()],
      },
      {
        plantIds: [randomUUID()],
      },
    ]) {
      const response = await request(app)
        .post('/api/users')
        .set('Cookie', admin.cookie)
        .set('Origin', origin)
        .send({
          ...input,
          ...override,
        })

      expect(response.status).toBe(422)
    }
  })
})
