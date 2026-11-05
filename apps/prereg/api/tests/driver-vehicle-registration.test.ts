import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { seedCitiesAndTransporters } from '../prisma/seed-master'
import { createTestUser, sessionFor, grant } from './helpers'

describe('UUID driver and vehicle data', () => {
  it('keeps master seeds repeatable and relates requests and decisions through UUIDs', async () => {
    await seedCitiesAndTransporters()
    await seedCitiesAndTransporters()
    const city = await prisma.city.findUniqueOrThrow({ where: { name: 'Karawang' } })
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
        cityId: city.id,
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
        driverCityId: city.id,
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
        vehiclePlateNumber: `CURSOR-${index}`,
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
})
