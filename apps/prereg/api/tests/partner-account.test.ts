import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'
import app from '../src/app'
import { cookieFrom, grant, login, origin, password, sessionFor } from './helpers'

describe('Merged partner accounts', () => {
  it('links multiple UUID partners, accepts optional contact details, and logs in using either SAP code', async () => {
    const admin = await sessionFor()
    await sessionFor('CUSTOMER')
    const partners = await Promise.all(
      [0, 1].map((number) =>
        prisma.partner.create({
          data: {
            sapCode: `SAP-${randomUUID()}-${number}`,
            name: 'Test partner',
            partnerType: 'CUSTOMER',
          },
        }),
      ),
    )
    const plant = await prisma.plant.create({
      data: { code: `P-${randomUUID()}`, name: 'Test plant' },
    })

    const response = await request(app)
      .post('/api/users')
      .set('Cookie', admin.cookie)
      .set('Origin', origin)
      .send({
        name: 'Partner account',
        username: partners[0]!.sapCode,
        accountType: 'PARTNER',
        role: 'CUSTOMER',
        partnerIds: partners.map((partner) => partner.id),
        plantIds: [plant.id],
      })

    expect(response.status).toBe(201)
    const account = response.body.data.user
    expect(account.id).toMatch(/^[a-f0-9-]{36}$/)
    expect(account.partners).toHaveLength(2)
    expect(account.plantAccess[0].id).toBe(plant.id)
    expect(account.email).toBeNull()

    const { hashPassword } = await import('../src/lib/password')
    await prisma.user.update({
      where: { id: account.id },
      data: { passwordHash: await hashPassword(password) },
    })
    expect((await login(partners[0]!.sapCode)).status).toBe(200)
    expect((await login(partners[1]!.sapCode)).status).toBe(200)
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'CUSTOMER' } })
    await grant(role.id, 'prereg:read')

    const duplicate = await request(app)
      .post('/api/users')
      .set('Cookie', admin.cookie)
      .set('Origin', origin)
      .send({
        name: 'Duplicate account',
        username: `other_${randomUUID()}`,
        accountType: 'PARTNER',
        role: 'CUSTOMER',
        partnerIds: [partners[0]!.id],
      })
    expect(duplicate.status).toBe(409)

    const own = cookieFrom(await login(partners[1]!.sapCode))
    expect((await request(app).get('/api/users').set('Cookie', own)).status).toBe(403)
  })

  it('rejects partner roles that do not match their SAP master data', async () => {
    const admin = await sessionFor()
    const partner = await prisma.partner.create({
      data: { sapCode: `SAP-${randomUUID()}`, name: 'Vendor', partnerType: 'VENDOR' },
    })

    const response = await request(app)
      .post('/api/users')
      .set('Cookie', admin.cookie)
      .set('Origin', origin)
      .send({
        name: 'Wrong type',
        username: `wrong_${randomUUID()}`,
        accountType: 'PARTNER',
        role: 'CUSTOMER',
        partnerIds: [partner.id],
      })
    expect(response.status).toBe(422)
  })
})
