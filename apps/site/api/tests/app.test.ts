import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'

const TEST_SITE = 'test-site'

afterAll(async () => {
  await prisma.journey.deleteMany({ where: { siteId: TEST_SITE } })
  await prisma.$disconnect()
})

describe('site-api', () => {
  it('reports health with controller status', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({ service: 'site-api', controllers: {} })
  })

  it('returns a stored journey from SQL Server', async () => {
    const journey = await prisma.journey.create({
      data: {
        siteId: TEST_SITE,
        transactionType: 'BEL',
        registrationOrigin: 'driver_entry',
        currentStage: 'regist_in',
        status: 'active',
      },
    })
    const res = await request(app).get(`/api/journeys/${journey.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ id: journey.id, transactionType: 'BEL', registrationOrigin: 'driver_entry' })
  })

  it('returns a 404 error body for an unknown journey', async () => {
    const res = await request(app).get(`/api/journeys/${randomUUID()}`)
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Journey not found' })
  })

  it('rejects an id that is not a UUID', async () => {
    const res = await request(app).get('/api/journeys/not-a-uuid')
    expect(res.status).toBe(422)
    expect(res.body.details).toHaveProperty('id')
  })
})
