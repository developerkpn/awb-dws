import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { seedTransporters } from '../prisma/seed/transporters'
import { createTestUser, sessionFor, grant, origin } from './helpers'

describe('UUID driver and vehicle data', () => {
  it('keeps master seeds repeatable and relates requests and decisions through UUIDs', async () => {
    await seedTransporters()
    await seedTransporters()
    const transporter = await prisma.transporter.findUniqueOrThrow({ where: { code: 'TR-PNR' } })
    const submitter = await createTestUser('VENDOR')
    const decider = await createTestUser('LOGISTIC')
    const run = randomUUID()

    const driver = await prisma.driver.create({
      data: {
        licenseNumber: `SIM-${run}`,
        name: 'Test driver',
        address: 'Test address',
        birthPlace: 'Karawang',
        birthDate: new Date('1990-01-01'),
        phone: '0800000000',
        city: 'Karawang',
      },
    })
    const vehicle = await prisma.vehicle.create({
      data: { plateNumber: `TEST-${run}`, transporterId: transporter.id },
    })
    const journey = await prisma.driverRequest.create({
      data: {
        submittedBy: submitter.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        driverLicenseNumber: driver.licenseNumber,
        driverName: driver.name,
        driverAddress: driver.address,
        driverBirthPlace: driver.birthPlace,
        driverBirthDate: driver.birthDate,
        driverPhone: driver.phone,
        driverCity: driver.city,
        vehiclePlateNumber: vehicle.plateNumber,
        transporterId: transporter.id,
        decisions: { create: { decision: 'APPROVED', decidedBy: decider.id } },
      },
      include: { decisions: true },
    })

    expect(journey.id).toMatch(/^[a-f0-9-]{36}$/)
    expect(driver.id[14]).toBe('7')
    expect(journey.decisions[0]!.decidedBy).toBe(decider.id)

    const storageTypes = await prisma.$queryRaw<{ data_type: string }[]>`
      SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN ('mst_user', 'mst_driver', 'awb_driver_request') AND column_name = 'id'
    `
    expect(storageTypes.every((column) => column.data_type === 'uuid')).toBe(true)

    const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'awb_driver_request'
    `
    expect(indexes.map((index) => index.indexname)).toContain(
      'awb_driver_request_status_created_at_id_idx',
    )
  })

  it('paginates a user’s requests without duplicates or access to another user’s data', async () => {
    const owner = await sessionFor('CUSTOMER')
    const other = await createTestUser('CUSTOMER')
    await grant(owner.user.roleId, 'prereg:read')
    const createdAt = new Date('2026-01-01T00:00:00.000Z')

    await prisma.driverRequest.createMany({
      data: [owner.user.id, owner.user.id, owner.user.id, other.id].map((submittedBy, index) => ({
        submittedBy,
        driverLicenseNumber: `CURSOR-${randomUUID()}`,
        driverName: 'Cursor test driver',
        driverAddress: 'Test address',
        driverBirthPlace: 'Test city',
        driverBirthDate: new Date('1990-01-01'),
        driverPhone: '0800000000',
        vehiclePlateNumber: `CURSOR-${randomUUID().slice(0, 12)}-${index}`,
        createdAt,
      })),
    })

    const first = await request(app).get('/api/driver-requests?limit=2').set('Cookie', owner.cookie)
    expect(first.status).toBe(200)
    expect(first.body.data.items).toHaveLength(2)
    const cursor = new URLSearchParams({ limit: '2', ...first.body.data.nextCursor })
    const second = await request(app)
      .get(`/api/driver-requests?${cursor}`)
      .set('Cookie', owner.cookie)

    expect(second.body.data.items).toHaveLength(1)
    expect(second.body.data.nextCursor).toBeNull()
    const combined = [...first.body.data.items, ...second.body.data.items] as {
      id: string
      submittedBy: string
    }[]
    expect(new Set(combined.map((item) => item.id)).size).toBe(3)
    expect(combined.every((item) => item.submittedBy === owner.user.id)).toBe(true)
    expect(
      (await request(app).get('/api/driver-requests?limit=10000').set('Cookie', owner.cookie))
        .status,
    ).toBe(422)
  })

  it('handles submission, duplicate checks, detail retrieval, and resubmission of rejected requests', async () => {
    await seedTransporters()
    const transporter = await prisma.transporter.findUniqueOrThrow({ where: { code: 'TR-PNR' } })
    const submitter = await sessionFor('CUSTOMER')
    const otherUser = await sessionFor('VENDOR')
    await grant(submitter.user.roleId, 'prereg:read')
    await grant(submitter.user.roleId, 'prereg:create')
    await grant(submitter.user.roleId, 'prereg:update')
    await grant(otherUser.user.roleId, 'prereg:read')

    // 1. Get transporters list
    const transportersRes = await request(app)
      .get('/api/driver-requests/transporters')
      .set('Cookie', submitter.cookie)
    expect(transportersRes.status).toBe(200)
    expect(transportersRes.body.data.length).toBeGreaterThanOrEqual(1)

    const run = randomUUID().slice(0, 8)
    const validPayload = {
      driverLicenseNumber: `SIM-${run}`,
      driverName: 'Budi Santoso',
      driverAddress: 'Jl. Merdeka No. 10',
      driverBirthPlace: 'Jakarta',
      driverBirthDate: '1992-05-12',
      driverPhone: '081234567890',
      driverCity: 'Jakarta',
      vehiclePlateNumber: `B-${run}-XYZ`,
      transporterId: transporter.id,
    }

    // 2. Submit new driver request
    const createRes = await request(app)
      .post('/api/driver-requests')
      .set('Origin', origin)
      .set('Cookie', submitter.cookie)
      .send(validPayload)

    expect(createRes.status).toBe(201)
    const requestId = createRes.body.data.id
    expect(createRes.body.data.status).toBe('SUBMITTED')
    expect(createRes.body.data.driverLicenseNumber).toBe(validPayload.driverLicenseNumber)

    // 3. Reject duplicate license number or plate number in pending/approved
    const dupRes = await request(app)
      .post('/api/driver-requests')
      .set('Origin', origin)
      .set('Cookie', submitter.cookie)
      .send(validPayload)
    expect(dupRes.status).toBe(409)

    // 4. Detail endpoint permission check (owner vs non-owner)
    const ownerDetail = await request(app)
      .get(`/api/driver-requests/${requestId}`)
      .set('Cookie', submitter.cookie)
    expect(ownerDetail.status).toBe(200)
    expect(ownerDetail.body.data.id).toBe(requestId)
    expect(ownerDetail.body.data.transporter.code).toBe('TR-PNR')

    const otherDetail = await request(app)
      .get(`/api/driver-requests/${requestId}`)
      .set('Cookie', otherUser.cookie)
    expect(otherDetail.status).toBe(404)

    // 5. Resubmit rejected only
    const prematureResubmit = await request(app)
      .put(`/api/driver-requests/${requestId}`)
      .set('Origin', origin)
      .set('Cookie', submitter.cookie)
      .send(validPayload)
    expect(prematureResubmit.status).toBe(422)

    // Simulate rejection by reviewer
    await prisma.driverRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', rejectionReason: 'Foto SIM buram' },
    })

    // 6. Resubmit rejected request
    const resubmitRes = await request(app)
      .put(`/api/driver-requests/${requestId}`)
      .set('Origin', origin)
      .set('Cookie', submitter.cookie)
      .send({
        ...validPayload,
        driverName: 'Budi Santoso Updated',
      })
    expect(resubmitRes.status).toBe(200)
    expect(resubmitRes.body.data.status).toBe('SUBMITTED')
    expect(resubmitRes.body.data.driverName).toBe('Budi Santoso Updated')
    expect(resubmitRes.body.data.rejectionReason).toBeNull()
  })
})
