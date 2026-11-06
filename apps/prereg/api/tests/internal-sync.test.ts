import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { env } from '../src/config/env'
import { createTestUser, sessionFor, grant, origin } from './helpers'
import { driverVehicleApprovedEvent } from '@awb/contracts'

describe('Internal sync and approval outbox (AWB-14)', () => {
  it('protects /api/internal with service authentication rather than user login', async () => {
    const unauth = await request(app).get('/api/internal/sync/outbox')
    expect(unauth.status).toBe(401)
    expect(unauth.body.error).toContain('Unauthorized internal service request')

    const wrongKey = await request(app)
      .get('/api/internal/sync/outbox')
      .set('x-service-key', 'wrong-key-value-12345')
    expect(wrongKey.status).toBe(401)

    const withHeader = await request(app)
      .get('/api/internal/sync/outbox')
      .set('x-service-key', env.INTERNAL_SERVICE_KEY)
    expect(withHeader.status).toBe(200)
    expect(Array.isArray(withHeader.body.data.messages)).toBe(true)

    const withBearer = await request(app)
      .get('/api/internal/sync/outbox')
      .set('Authorization', `Bearer ${env.INTERNAL_SERVICE_KEY}`)
    expect(withBearer.status).toBe(200)
    expect(Array.isArray(withBearer.body.data.messages)).toBe(true)
  })

  it('creates outbox message atomically upon logistics approval and prevents duplicate approvals', async () => {
    const logistic = await sessionFor('LOGISTIC')
    await grant(logistic.user.roleId, 'prereg:approve')
    const customer = await createTestUser('CUSTOMER')
    const run = randomUUID()

    const reqRecord = await prisma.driverRequest.create({
      data: {
        submittedBy: customer.id,
        driverLicenseNumber: `SIM-${run}`,
        driverName: 'Approval Test Driver',
        driverAddress: 'Jl. Industri No. 1',
        driverBirthPlace: 'Karawang',
        driverBirthDate: new Date('1992-05-15'),
        driverPhone: '08123456789',
        driverCity: 'Karawang',
        vehiclePlateNumber: `B-${run.slice(0, 4).toUpperCase()}-KPN`,
        status: 'SUBMITTED',
        siteId: 'PRISCOLIN_KARAWANG',
      },
    })

    const initialOutboxCount = await prisma.syncOutbox.count({
      where: { aggregateId: reqRecord.id },
    })
    expect(initialOutboxCount).toBe(0)

    const approveRes = await request(app)
      .post(`/api/driver-requests/${reqRecord.id}/approve`)
      .set('Origin', origin)
      .set('Cookie', logistic.cookie)
      .send({ siteId: 'PRISCOLIN_KARAWANG' })

    expect(approveRes.status).toBe(200)
    expect(approveRes.body.data.status).toBe('APPROVED')
    expect(approveRes.body.data.outboxId).toBeTypeOf('number')
    expect(approveRes.body.data.eventId).toMatch(/^[a-f0-9-]{36}$/)

    const updatedRequest = await prisma.driverRequest.findUniqueOrThrow({
      where: { id: reqRecord.id },
      include: { decisions: true },
    })
    expect(updatedRequest.status).toBe('APPROVED')
    expect(updatedRequest.decidedBy).toBe(logistic.user.id)
    expect(updatedRequest.decisions).toHaveLength(1)
    expect(updatedRequest.decisions[0]!.decision).toBe('APPROVED')

    const outboxRecord = await prisma.syncOutbox.findUniqueOrThrow({
      where: { eventId: approveRes.body.data.eventId },
    })
    expect(outboxRecord.aggregateId).toBe(reqRecord.id)
    expect(outboxRecord.eventType).toBe('driver_vehicle.approved')
    expect(outboxRecord.siteId).toBe('PRISCOLIN_KARAWANG')
    expect(outboxRecord.status).toBe('PENDING')

    const parsedEnvelope = driverVehicleApprovedEvent.safeParse(outboxRecord.payload)
    expect(parsedEnvelope.success).toBe(true)
    if (parsedEnvelope.success) {
      expect(parsedEnvelope.data.payload.driver.name).toBe('Approval Test Driver')
      expect(parsedEnvelope.data.payload.vehicle.plateNumber).toBe(reqRecord.vehiclePlateNumber)
    }

    const secondApprove = await request(app)
      .post(`/api/driver-requests/${reqRecord.id}/approve`)
      .set('Origin', origin)
      .set('Cookie', logistic.cookie)
      .send({ siteId: 'PRISCOLIN_KARAWANG' })

    expect(secondApprove.status).toBe(400)
    expect(secondApprove.body.error).toContain('already approved')
  })

  it('retrieves messages after sequence X and acknowledges receipt up to Y without data loss or duplicates', async () => {
    const siteKey = env.INTERNAL_SERVICE_KEY
    const targetSite = `site-${randomUUID().slice(0, 8)}`

    const outbox1 = await prisma.syncOutbox.create({
      data: {
        eventId: randomUUID(),
        eventType: 'driver_vehicle.approved',
        siteId: targetSite,
        aggregateId: randomUUID(),
        payload: { testSeq: 1 },
        status: 'PENDING',
      },
    })

    const outbox2 = await prisma.syncOutbox.create({
      data: {
        eventId: randomUUID(),
        eventType: 'driver_vehicle.approved',
        siteId: targetSite,
        aggregateId: randomUUID(),
        payload: { testSeq: 2 },
        status: 'PENDING',
      },
    })

    const outbox3 = await prisma.syncOutbox.create({
      data: {
        eventId: randomUUID(),
        eventType: 'driver_vehicle.approved',
        siteId: targetSite,
        aggregateId: randomUUID(),
        payload: { testSeq: 3 },
        status: 'PENDING',
      },
    })

    const fetchAll = await request(app)
      .get(`/api/internal/sync/outbox?after=${outbox1.id - 1}&siteId=${targetSite}`)
      .set('x-service-key', siteKey)

    expect(fetchAll.status).toBe(200)
    expect(fetchAll.body.data.messages.length).toBeGreaterThanOrEqual(3)
    const returnedIds = fetchAll.body.data.messages.map((m: { id: number }) => m.id)
    expect(returnedIds).toContain(outbox1.id)
    expect(returnedIds).toContain(outbox2.id)
    expect(returnedIds).toContain(outbox3.id)

    const fetchAfterFirst = await request(app)
      .get(`/api/internal/sync/outbox?after=${outbox1.id}&siteId=${targetSite}`)
      .set('x-service-key', siteKey)

    expect(fetchAfterFirst.status).toBe(200)
    const afterIds = fetchAfterFirst.body.data.messages.map((m: { id: number }) => m.id)
    expect(afterIds).not.toContain(outbox1.id)
    expect(afterIds).toContain(outbox2.id)
    expect(afterIds).toContain(outbox3.id)

    const ackRes = await request(app)
      .post('/api/internal/sync/ack')
      .set('x-service-key', siteKey)
      .send({ upTo: outbox2.id, siteId: targetSite })

    expect(ackRes.status).toBe(200)
    expect(ackRes.body.data.acknowledgedCount).toBeGreaterThanOrEqual(2)

    const check1 = await prisma.syncOutbox.findUniqueOrThrow({ where: { id: outbox1.id } })
    const check2 = await prisma.syncOutbox.findUniqueOrThrow({ where: { id: outbox2.id } })
    const check3 = await prisma.syncOutbox.findUniqueOrThrow({ where: { id: outbox3.id } })

    expect(check1.status).toBe('ACKNOWLEDGED')
    expect(check1.acknowledgedAt).not.toBeNull()
    expect(check2.status).toBe('ACKNOWLEDGED')
    expect(check2.acknowledgedAt).not.toBeNull()
    expect(check3.status).toBe('PENDING')
    expect(check3.acknowledgedAt).toBeNull()

    const secondFetchAfterFirst = await request(app)
      .get(`/api/internal/sync/outbox?after=${outbox1.id}&siteId=${targetSite}`)
      .set('x-service-key', siteKey)

    expect(secondFetchAfterFirst.body.data.messages.map((m: { id: number }) => m.id)).toEqual(
      afterIds,
    )
  })
})
