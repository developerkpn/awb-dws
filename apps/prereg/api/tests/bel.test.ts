import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import gateway from '../src/modules/sap/sap.repository'
import staging from '../src/modules/sap/sap-stage.repository'
import { createTestUser, grant, login, cookieFrom, origin } from './helpers'
import { installSapMock, stagedBelRows } from './sap-mock'

let vendorA: Awaited<ReturnType<typeof createTestUser>>
let vendorB: Awaited<ReturnType<typeof createTestUser>>
let logisticAssigned: Awaited<ReturnType<typeof createTestUser>>
let logisticOtherPlant: Awaited<ReturnType<typeof createTestUser>>
let customerUser: Awaited<ReturnType<typeof createTestUser>>
let vendorACookie = ''
let vendorBCookie = ''
let logisticCookie = ''
let otherLogisticCookie = ''
let customerCookie = ''
let plantId = ''
let otherPlantId = ''

const testUserIds: string[] = []

function reqAs(cookie: string) {
  return {
    get: (path: string) =>
      request(app)
        .get('/api/bel' + path)
        .set('Cookie', cookie),
    post: (path: string, body?: object) =>
      request(app)
        .post('/api/bel' + path)
        .set('Origin', origin)
        .set('Cookie', cookie)
        .send(body),
    put: (path: string, body?: object) =>
      request(app)
        .put('/api/bel' + path)
        .set('Origin', origin)
        .set('Cookie', cookie)
        .send(body),
  }
}

beforeAll(async () => {
  installSapMock()

  vendorA = await createTestUser('VENDOR')
  vendorB = await createTestUser('VENDOR')
  logisticAssigned = await createTestUser('LOGISTIC')
  logisticOtherPlant = await createTestUser('LOGISTIC')
  customerUser = await createTestUser('CUSTOMER')

  testUserIds.push(
    vendorA.id,
    vendorB.id,
    logisticAssigned.id,
    logisticOtherPlant.id,
    customerUser.id,
  )

  for (const code of ['prereg:read', 'prereg:create', 'prereg:update']) {
    await grant(vendorA.roleId, code)
    await grant(customerUser.roleId, code)
  }

  for (const code of ['prereg:read', 'prereg:approve']) {
    await grant(logisticAssigned.roleId, code)
  }

  const plant = await prisma.plant.upsert({
    where: {
      code: 'PRISCOLIN_KARAWANG',
    },
    create: {
      code: 'PRISCOLIN_KARAWANG',
      name: 'BEL Test Downstream Plant',
      sapPlantCode: '3701',
      companyGroup: 'DOWNSTREAM',
    },
    update: {
      isActive: true,
      sapPlantCode: '3701',
      companyGroup: 'DOWNSTREAM',
    },
  })

  const secondaryPlant = await prisma.plant.upsert({
    where: {
      code: 'BEL_TEST_OTHER_PLANT',
    },
    create: {
      code: 'BEL_TEST_OTHER_PLANT',
      name: 'BEL Unassigned Plant',
      sapPlantCode: '3999',
      companyGroup: 'DOWNSTREAM',
    },
    update: {
      isActive: true,
      sapPlantCode: '3999',
      companyGroup: 'DOWNSTREAM',
    },
  })

  plantId = plant.id
  otherPlantId = secondaryPlant.id

  await prisma.userPlant.createMany({
    data: [
      {
        userId: vendorA.id,
        plantId,
      },
      {
        userId: vendorB.id,
        plantId,
      },
      {
        userId: logisticAssigned.id,
        plantId,
      },
      {
        userId: logisticOtherPlant.id,
        plantId: otherPlantId,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.driver.upsert({
    where: {
      licenseNumber: '8890000000000001',
    },
    create: {
      licenseNumber: '8890000000000001',
      name: 'BEL Driver One',
      isActive: true,
      inSap: true,
    },
    update: {
      name: 'BEL Driver One',
      isActive: true,
      inSap: true,
    },
  })

  await prisma.driver.upsert({
    where: {
      licenseNumber: '8890000000000002',
    },
    create: {
      licenseNumber: '8890000000000002',
      name: 'BEL Driver Two',
      isActive: true,
      inSap: true,
    },
    update: {
      name: 'BEL Driver Two',
      isActive: true,
      inSap: true,
    },
  })

  await prisma.vehicle.upsert({
    where: {
      plateNumber: 'B 9001 BEL',
    },
    create: {
      plateNumber: 'B 9001 BEL',
      isActive: true,
      inSap: true,
    },
    update: {
      isActive: true,
      inSap: true,
    },
  })

  await prisma.vehicle.upsert({
    where: {
      plateNumber: 'B 9002 BEL',
    },
    create: {
      plateNumber: 'B 9002 BEL',
      isActive: true,
      inSap: true,
    },
    update: {
      isActive: true,
      inSap: true,
    },
  })

  vendorACookie = cookieFrom(await login(vendorA.username))
  vendorBCookie = cookieFrom(await login(vendorB.username))
  logisticCookie = cookieFrom(await login(logisticAssigned.username))
  otherLogisticCookie = cookieFrom(await login(logisticOtherPlant.username))
  customerCookie = cookieFrom(await login(customerUser.username))
})

beforeEach(() => {
  installSapMock()
  stagedBelRows.clear()
})

afterAll(async () => {
  const registrations = await prisma.belRegistration.findMany({
    where: {
      vendorId: {
        in: testUserIds,
      },
    },
    select: {
      id: true,
    },
  })

  const ids = registrations.map((row) => row.id)

  await prisma.belLine.deleteMany({
    where: {
      registrationId: {
        in: ids,
      },
    },
  })

  await prisma.belRegistration.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  })

  await prisma.belDocument.deleteMany({
    where: {
      vendorId: {
        in: testUserIds,
      },
    },
  })

  await prisma.userPlant.deleteMany({
    where: {
      userId: {
        in: testUserIds,
      },
    },
  })

  await prisma.user.deleteMany({
    where: {
      id: {
        in: testUserIds,
      },
    },
  })

  await prisma.driver.deleteMany({
    where: {
      licenseNumber: {
        in: ['8890000000000001', '8890000000000002'],
      },
    },
  })

  await prisma.vehicle.deleteMany({
    where: {
      plateNumber: {
        in: ['B 9001 BEL', 'B 9002 BEL'],
      },
    },
  })

  vi.restoreAllMocks()
})

describe('vendor BEL pre-registration', () => {
  it('nets SAP goods movements per PO item, keeps only open trade items of the vendor, and skips DP and DOTRXSet', async () => {
    const dpSpy = vi.spyOn(gateway, 'read')
    const triggerSpy = vi.spyOn(gateway, 'trigger')

    const poResponse = await reqAs(vendorACookie).get('/po-items')

    expect(poResponse.status).toBe(200)

    const items = poResponse.body.data as {
      id: string
      poNumber: string
      poItem: string
      material: string
      orderedQuantity: string
      sapReceivedQuantity: string
      availableQuantity: string
    }[]

    expect(items.map((item) => `${item.poNumber}/${item.poItem}`)).toEqual([
      '4500000001/00010',
      '4500000001/00020',
      '4500000002/00010',
    ])

    expect(items[0]).toMatchObject({
      material: '8000001001',
      orderedQuantity: '1500',
      sapReceivedQuantity: '850',
      availableQuantity: '650',
    })

    expect(items[1]).toMatchObject({
      poNumber: '4500000001',
      poItem: '00020',
      sapReceivedQuantity: '0',
      availableQuantity: '500',
    })

    expect(items[2]).toMatchObject({
      poNumber: '4500000002',
      uom: 'KG',
      sapReceivedQuantity: '400',
      availableQuantity: '1600',
    })

    expect(dpSpy.mock.calls.map(([entity]) => entity)).not.toContain('ZPINOSet')
    expect(triggerSpy).not.toHaveBeenCalled()
  })

  it('enforces PO quota limits and serializes concurrent reservations', async () => {
    const poResponse = await reqAs(vendorACookie).get('/po-items')
    const items = poResponse.body.data as { id: string; poNumber: string; poItem: string }[]
    const poItem20 = items.find((item) => item.poItem === '00020')!

    const overQuota = await reqAs(vendorACookie).post('', {
      lines: [
        {
          documentId: poItem20.id,
          driverLicenseNumber: '8890000000000001',
          vehiclePlateNumber: 'B 9001 BEL',
          quantity: '501',
          mediaTransport: 'T',
        },
      ],
    })

    expect(overQuota.status).toBe(409)
    expect(overQuota.body.error).toMatch(/remaining quota is 500 KG/i)

    const first = await reqAs(vendorACookie).post('', {
      lines: [
        {
          documentId: poItem20.id,
          driverLicenseNumber: '8890000000000001',
          vehiclePlateNumber: 'B 9001 BEL',
          quantity: '350',
          mediaTransport: 'T',
        },
      ],
    })

    expect(first.status).toBe(201)

    await reqAs(vendorACookie).post(`/${first.body.data.id}/submit`, {
      version: first.body.data.version,
    })

    const concurrent = await Promise.all([
      reqAs(vendorACookie).post('', {
        lines: [
          {
            documentId: poItem20.id,
            driverLicenseNumber: '8890000000000001',
            vehiclePlateNumber: 'B 9001 BEL',
            quantity: '100',
            mediaTransport: 'T',
          },
        ],
      }),
      reqAs(vendorACookie).post('', {
        lines: [
          {
            documentId: poItem20.id,
            driverLicenseNumber: '8890000000000002',
            vehiclePlateNumber: 'B 9002 BEL',
            quantity: '100',
            mediaTransport: 'T',
          },
        ],
      }),
    ])

    const statuses = concurrent.map((entry) => entry.status).sort()

    expect(statuses).toEqual([201, 409])

    const winner = concurrent.find((entry) => entry.status === 201)!

    await reqAs(vendorACookie).post(`/${winner.body.data.id}/cancel`, {
      reason: 'Release reserved PO quota for another truck',
      version: winner.body.data.version,
    })

    const refreshed = await reqAs(vendorACookie).get('/po-items')

    const afterCancel = (
      refreshed.body.data as { poItem: string; availableQuantity: string }[]
    ).find((item) => item.poItem === '00020')!

    expect(afterCancel.availableQuantity).toBe('150')
  })

  it('validates SAP master driver/vehicle, stages approval to Oracle BEL without SAP password, and updates staging on cancel', async () => {
    const dpSpy = vi.spyOn(gateway, 'read')
    const triggerSpy = vi.spyOn(gateway, 'trigger')
    const stageBelSpy = vi.spyOn(staging, 'stageBel')

    const poResponse = await reqAs(vendorACookie).get('/po-items')

    const poItem10 = (poResponse.body.data as { id: string; poItem: string }[]).find(
      (item) => item.poItem === '00010',
    )!

    const badMaster = await reqAs(vendorACookie).post('', {
      lines: [
        {
          documentId: poItem10.id,
          driverLicenseNumber: 'NON-EXISTENT-SIM',
          vehiclePlateNumber: 'B 9001 BEL',
          quantity: '50',
          mediaTransport: 'T',
        },
      ],
    })

    expect(badMaster.status).toBe(422)

    const draft = await reqAs(vendorACookie).post('', {
      lines: [
        {
          documentId: poItem10.id,
          quantity: '120',
          loadingDate: '2026-11-11',
          mediaTransport: 'T',
          remark: 'Batch BEL test',
        },
      ],
    })

    expect(draft.status).toBe(201)

    const submitWithoutTransport = await reqAs(vendorACookie).post(
      `/${draft.body.data.id}/submit`,
      {
        version: draft.body.data.version,
      },
    )

    expect(submitWithoutTransport.status).toBe(422)

    const updated = await reqAs(vendorACookie).put(`/${draft.body.data.id}`, {
      version: draft.body.data.version,
      lines: [
        {
          documentId: poItem10.id,
          driverLicenseNumber: '8890000000000001',
          vehiclePlateNumber: 'B 9001 BEL',
          quantity: '120',
          loadingDate: '2026-11-11',
          mediaTransport: 'T',
          remark: 'Updated transport',
        },
      ],
    })

    expect(updated.status).toBe(200)

    const submitted = await reqAs(vendorACookie).post(`/${updated.body.data.id}/submit`, {
      version: updated.body.data.version,
    })

    expect(submitted.status).toBe(200)
    expect(submitted.body.data.status).toBe('SUBMITTED')

    const forbiddenApprove = await reqAs(vendorACookie).post(`/${submitted.body.data.id}/approve`, {
      version: submitted.body.data.version,
    })

    expect(forbiddenApprove.status).toBe(403)

    const wrongPlantApprove = await reqAs(otherLogisticCookie).post(
      `/${submitted.body.data.id}/approve`,
      {
        version: submitted.body.data.version,
      },
    )

    expect(wrongPlantApprove.status).toBe(404)

    const approved = await reqAs(logisticCookie).post(`/${submitted.body.data.id}/approve`, {
      version: submitted.body.data.version,
    })

    expect(approved.status).toBe(200)
    expect(approved.body.data.status).toBe('APPROVED')

    const line = approved.body.data.lines[0]

    expect(line.stagedAt).toBeTruthy()
    expect(stageBelSpy).toHaveBeenCalledTimes(1)

    expect(stagedBelRows.get(line.id)).toMatchObject({
      DET_ID: line.id,
      HEAD_ID: approved.body.data.id,
      LIFNR: vendorA.username,
      EBELN: '4500000001',
      EBELP: '00010',
      WERKS: '3701',
      PLN_MENGE: '120',
      PREREG_STATUS: 'APPROVED',
      FLAG: 'I',
      ISACTIVE: 'TRUE',
      ISRETREIVEDBYSAP: 'FALSE',
    })

    const cancelled = await reqAs(vendorACookie).post(`/${approved.body.data.id}/cancel`, {
      reason: 'Vendor rescheduled pickup',
      version: approved.body.data.version,
    })

    expect(cancelled.status).toBe(200)
    expect(cancelled.body.data.status).toBe('CANCELLED')

    expect(stagedBelRows.get(line.id)).toMatchObject({
      PREREG_STATUS: 'CANCELLED',
      FLAG: 'U',
      ISACTIVE: 'FALSE',
    })

    expect(dpSpy.mock.calls.map(([entity]) => entity)).not.toContain('ZPINOSet')
    expect(triggerSpy).not.toHaveBeenCalled()
  })

  it('supports rejection with quota release, RBAC isolation, and paginated sorting', async () => {
    const customerList = await reqAs(customerCookie).get('')

    expect(customerList.status).toBe(403)

    const poResponse = await reqAs(vendorACookie).get('/po-items')

    const poItem30 = (poResponse.body.data as { id: string; poNumber: string }[]).find(
      (item) => item.poNumber === '4500000002',
    )!

    const created = await reqAs(vendorACookie).post('', {
      lines: [
        {
          documentId: poItem30.id,
          driverLicenseNumber: '8890000000000002',
          vehiclePlateNumber: 'B 9002 BEL',
          quantity: '250',
          mediaTransport: 'V',
        },
      ],
    })

    const regId = created.body.data.id as string

    const isolatedRead = await reqAs(vendorBCookie).get(`/${regId}`)

    expect(isolatedRead.status).toBe(404)

    const isolatedPo = await reqAs(vendorBCookie).get(`/po-items?vendorId=${vendorA.id}`)

    expect(isolatedPo.status).toBe(403)

    const submitted = await reqAs(vendorACookie).post(`/${regId}/submit`, {
      version: created.body.data.version,
    })

    const rejected = await reqAs(logisticCookie).post(`/${regId}/reject`, {
      reason: 'Incorrect transport capacity for vessel',
      version: submitted.body.data.version,
    })

    expect(rejected.status).toBe(200)
    expect(rejected.body.data.status).toBe('REJECTED')

    const listed = await reqAs(vendorACookie).get('?page=1&limit=2&sortBy=number&sortOrder=asc')

    expect(listed.status).toBe(200)
    expect(listed.body.data.items.length).toBeLessThanOrEqual(2)
    expect(listed.body.data.total).toBeGreaterThanOrEqual(1)
  })
})
