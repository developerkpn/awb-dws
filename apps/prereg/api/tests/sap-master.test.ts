import { randomUUID } from 'node:crypto'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { SapMasterSummary } from '@awb/contracts'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import gateway from '../src/modules/sap/sap.repository'
import { grant, origin, sessionFor } from './helpers'
import { masterPages } from './sap-mock'

const page = gateway.page.bind(gateway)

const drivers = Array.from(
  {
    length: 2500,
  },
  (_, index) => ({
    Snosim: String(7700000000000000 + index),
    Snama: 'Imported Driver ' + index,
    ZwbLoc: 'EU23',
  }),
)

const trucks = Array.from(
  {
    length: 100,
  },
  (_, index) => ({
    Nnopolisi: ` b  ${7000 + index} imp `,
    ZwbLoc: 'PS1',
  }),
)

async function summary(cookie: string) {
  const response = await request(app)
    .get('/api/sap-master')
    .set('Origin', origin)
    .set('Cookie', cookie)

  return response.body.data as SapMasterSummary
}

async function finished(cookie: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await summary(cookie)

    if (result.latestImport?.status !== 'RUNNING') return result

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  throw new Error('SAP import did not finish')
}

function start(cookie: string) {
  return request(app).post('/api/sap-master/imports').set('Origin', origin).set('Cookie', cookie)
}

async function cleanup() {
  await prisma.driver.deleteMany({
    where: {
      licenseNumber: { startsWith: '77000000' },
    },
  })

  await prisma.vehicle.deleteMany({
    where: {
      plateNumber: { endsWith: ' IMP' },
    },
  })
}

afterEach(async () => {
  gateway.page = page
  delete masterPages.SIMSet
  delete masterPages.TRUCKSet
  await prisma.sapMasterImport.deleteMany()
})

afterAll(cleanup)

describe('SAP driver and truck download', () => {
  it('is limited to administrators', async () => {
    const logistic = await sessionFor('LOGISTIC')

    await grant(logistic.user.roleId, 'prereg:approve')

    expect(
      (
        await request(app)
          .get('/api/sap-master')
          .set('Origin', origin)
          .set('Cookie', logistic.cookie)
      ).status,
    ).toBe(403)

    expect((await start(logistic.cookie)).status).toBe(403)
  })

  it('pages through SAP, stops when SAP repeats a page and saves rows as registered in SAP', async () => {
    await cleanup()
    const admin = await sessionFor()

    await prisma.driver.create({
      data: {
        licenseNumber: '7700000000000005',
        name: 'Old local name',
        phone: '0800000000',
      },
    })

    masterPages.SIMSet = drivers
    const pagedSkips: number[] = []

    gateway.page = async (entity, paging) => {
      if (entity === 'TRUCKSet') {
        pagedSkips.push(paging.skip)

        return trucks
      }

      return page(entity, paging)
    }

    const started = await start(admin.cookie)

    expect(started.status).toBe(202)
    expect(started.body.data.status).toBe('RUNNING')
    const result = await finished(admin.cookie)

    expect(result.latestImport).toMatchObject({
      status: 'SUCCEEDED',
      driverCount: 2500,
      vehicleCount: 100,
      error: null,
    })

    expect(pagedSkips).toEqual([0, 100])

    expect(
      await prisma.driver.count({
        where: {
          licenseNumber: { startsWith: '77000000' },
          inSap: true,
        },
      }),
    ).toBe(2500)

    expect(
      await prisma.driver.findUniqueOrThrow({
        where: { licenseNumber: '7700000000000005' },
      }),
    ).toMatchObject({
      name: 'Imported Driver 5',
      phone: '0800000000',
      sapLocation: 'EU23',
      inSap: true,
    })

    expect(
      await prisma.vehicle.findUniqueOrThrow({
        where: { plateNumber: 'B 7042 IMP' },
      }),
    ).toMatchObject({
      inSap: true,
      sapLocation: 'PS1',
    })

    expect(result.drivers).toBeGreaterThanOrEqual(2500)
  })

  it('allows one download at a time and records SAP failures', async () => {
    const admin = await sessionFor()

    await prisma.sapMasterImport.create({
      data: { startedById: admin.user.id },
    })

    expect((await start(admin.cookie)).status).toBe(409)
    await prisma.sapMasterImport.deleteMany()

    gateway.page = async () => {
      throw new Error('SAP lookup is unavailable')
    }

    expect((await start(admin.cookie)).status).toBe(202)

    expect((await finished(admin.cookie)).latestImport).toMatchObject({
      status: 'FAILED',
      error: 'SAP lookup is unavailable',
    })
  })
})

describe('Driver and vehicle requests', () => {
  it('blocks a request for a driver or vehicle that SAP already has', async () => {
    const owner = await sessionFor('CUSTOMER')

    await grant(owner.user.roleId, 'prereg:create')

    const reference = '/api/documents/' + randomUUID()

    const body = {
      kind: 'DRIVER',
      siteId: 'TEST_REQUEST_PLANT',
      driverLicenseNumber: '8800000000000002',
      driverName: 'Demo Driver Two',
      driverBirthPlace: 'Jakarta',
      driverBirthDate: '1990-01-01',
      driverPhone: '0800000000',
      driverCity: 'Jakarta',
      driverAddress: 'Jl. Test',
      driverLicensePhotoUrl: reference,
      driverPhotoUrl: reference,
    }

    const submit = (data: object) =>
      request(app)
        .post('/api/driver-requests')
        .set('Origin', origin)
        .set('Cookie', owner.cookie)
        .send(data)

    const driverExists = await submit(body)

    expect(driverExists.status).toBe(409)
    expect(driverExists.body.error).toMatch(/driver is already registered in SAP/)

    const vehicleExists = await submit({
      kind: 'VEHICLE',
      siteId: 'TEST_REQUEST_PLANT',
      vehiclePlateNumber: 'B 1002 DEMO',
      vehicleStnkPhotoUrl: reference,
    })

    expect(vehicleExists.status).toBe(409)
    expect(vehicleExists.body.error).toMatch(/vehicle is already registered in SAP/)
  })
})
