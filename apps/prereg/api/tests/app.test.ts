import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'

const TEST_SITE = 'test-site'

afterAll(async () => {
  await prisma.preRegistration.deleteMany({ where: { siteId: TEST_SITE } })
  await prisma.$disconnect()
})

describe('prereg-api', () => {
  it('reports health', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true, data: { service: 'prereg-api' } })
  })

  it('returns a stored pre-registration from PostgreSQL', async () => {
    const preRegistration = await prisma.preRegistration.create({
      data: { siteId: TEST_SITE, transactionType: 'JUL', referenceDocument: 'LN-TEST-001', status: 'approved' },
    })
    const res = await request(app).get(`/api/pre-registrations/${preRegistration.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ id: preRegistration.id, transactionType: 'JUL', referenceDocument: 'LN-TEST-001' })
  })

  it('returns a 404 error body for an unknown pre-registration', async () => {
    const res = await request(app).get(`/api/pre-registrations/${randomUUID()}`)
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Pre-registration not found' })
  })

  it('rejects an id that is not a UUID', async () => {
    const res = await request(app).get('/api/pre-registrations/not-a-uuid')
    expect(res.status).toBe(422)
    expect(res.body.details).toHaveProperty('id')
  })
})
