import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { prisma } from '../src/config/prisma'
import app from '../src/app'
import { env, environmentSchema } from '../src/config/env'
import service from '../src/modules/jul/jul.service'
import gateway from '../src/modules/sap/sap.repository'
import staging from '../src/modules/sap/sap-stage.repository'
import {
  fixtureReferences,
  installSapMock,
  seedTestJulRules,
  setStageError,
  simulateCompletion,
  stagedRows,
} from './sap-mock'
import { businessDate, legacyPaymentAmount, quantity, quantityText } from '../src/lib/quantity'
import { createTestUser, login, cookieFrom, grant, origin, sessionFor } from './helpers'
import type { JulRequestDetail } from '@awb/contracts'

const fetchSpy = vi.fn(() => {
  throw new Error('Unexpected network call')
})

let admin: Awaited<ReturnType<typeof sessionFor>>
let customer: Awaited<ReturnType<typeof createTestUser>>
let cookie: string
let plantId: string
let refs: string[]
const users: string[] = []

const api = (path: string, session = cookie) =>
  request(app)
    .get('/api/jul' + path)
    .set('Cookie', session)

const post = (path: string, body: object, session = cookie) =>
  request(app)
    .post('/api/jul' + path)
    .set('Cookie', session)
    .set('Origin', origin)
    .send(body)

async function document(reference = refs[0]!) {
  const result = await api('/documents').query({ reference })

  expect(result.status, JSON.stringify(result.body)).toBe(200)

  return result.body.data as {
    id: string
    availableQuantity: string
    reservedQuantity: string
    heldQuantity: string
    sapUsedQuantity: string
    deletedQuantity: string
    transportModes: { code: string; name: string }[]
    paid: boolean
    unpaidAmount: string
  }
}

async function draft(amount = '100', reference = refs[0]!, lines = 1) {
  const doc = await document(reference)

  const response = await post('', {
    lines: Array.from({ length: lines }, () => ({
      documentId: doc.id,
      variant: 'LCO',
      quantity: amount,
      mediaTransport: 'T',
      driverLicenseNumber: '8800000000000001',
      vehiclePlateNumber: 'B 1001 DEMO',
      loadingDate: businessDate(),
    })),
  })

  expect(response.status, JSON.stringify(response.body)).toBe(201)

  return response.body.data as JulRequestDetail
}

async function submit(row: JulRequestDetail) {
  const response = await post('/' + row.id + '/submit', { version: row.version })

  expect(response.status, JSON.stringify(response.body)).toBe(200)

  return response.body.data as JulRequestDetail
}

function approval(row: JulRequestDetail, selected = row.lines) {
  return {
    version: row.version,
    sapPassword: 'request-only-secret',
    lines: selected.map((line) => ({
      id: line.id,
      factoryStorage: 'D001',
      otherStorage: 'D002',
      factoryValuation: 'DEMO-FAC',
      otherValuation: 'DEMO-OTH',
      factoryBatch: '37',
      otherBatch: line.referenceDocument,
    })),
  }
}

beforeAll(async () => {
  vi.stubGlobal('fetch', fetchSpy)
  installSapMock()
  admin = await sessionFor()
  customer = await createTestUser('CUSTOMER')
  users.push(admin.user.id, customer.id)
  for (const code of ['prereg:read', 'prereg:create', 'prereg:update'])
    await grant(customer.role.id, code)

  const plant = await prisma.plant.upsert({
    where: { code: 'PRISCOLIN_KARAWANG' },
    create: {
      code: 'PRISCOLIN_KARAWANG',
      name: 'Demo test plant',
      sapPlantCode: '3701',
      companyGroup: 'DOWNSTREAM',
    },
    update: {
      isActive: true,
      sapPlantCode: '3701',
      companyGroup: 'DOWNSTREAM',
    },
  })

  plantId = plant.id
  await seedTestJulRules(plantId)

  await prisma.userPlant.create({
    data: {
      userId: customer.id,
      plantId,
    },
  })

  cookie = cookieFrom(await login(customer.username))

  refs = fixtureReferences({
    id: customer.id,
    username: customer.username,
    role: 'CUSTOMER',
  })
})

afterAll(async () => {
  const registrations = await prisma.julRegistration.findMany({
    where: {
      customerId: { in: users },
    },
    select: { id: true },
  })

  const ids = registrations.map((row) => row.id)

  await prisma.julLine.deleteMany({
    where: {
      registrationId: { in: ids },
    },
  })

  await prisma.julJob.deleteMany({
    where: {
      registrationId: { in: ids },
    },
  })

  await prisma.julRegistration.deleteMany({
    where: {
      id: { in: ids },
    },
  })

  await prisma.julDocument.deleteMany({
    where: {
      customerId: { in: users },
    },
  })

  await prisma.julHold.deleteMany({
    where: {
      actorId: { in: users },
    },
  })

  await prisma.driverRequest.deleteMany({
    where: {
      submittedBy: { in: users },
    },
  })

  await prisma.driver.deleteMany({
    where: { licenseNumber: 'LOCAL-SIM-9999' },
  })

  await prisma.vehicle.deleteMany({
    where: { plateNumber: 'B 9999 LOC' },
  })

  vi.unstubAllGlobals()
})

describe('downstream JUL', () => {
  it('preserves payment punctuation/tolerance and exact six-place quantities', async () => {
    expect(legacyPaymentAmount(' 1.234,50 ')).toBe(123450n)
    expect(legacyPaymentAmount('   ')).toBe(0n)
    expect(quantityText(quantity('123.000001'))).toBe('123.000001')
    expect(() => quantity('1.0000001')).toThrow()
    const unpaid = await document(refs[2])
    const eligible = await document(refs[3])

    expect(unpaid).toMatchObject({
      paid: false,
      unpaidAmount: '5001',
    })

    expect(eligible).toMatchObject({
      paid: true,
      unpaidAmount: '5000',
    })

    const response = await post('', {
      lines: [
        {
          documentId: unpaid.id,
          variant: 'LCO',
          quantity: '1',
          mediaTransport: 'T',
        },
      ],
    })

    expect(response.status).toBe(422)
  })

  it('enforces NODE_ENV erpdev vs erpprd SAP and Oracle targets', async () => {
    const base = {
      ...env,
      BCRYPT_ROUNDS: 12,
      APP_ORIGIN: 'https://prereg.kpn.example',
      INTERNAL_SERVICE_KEYS: JSON.stringify({
        SITE: 'x'.repeat(32),
      }),
      SAP_SERVICE_USERNAME: 'service_user',
      SAP_SERVICE_PASSWORD: 'service_password',
      SAP_ORACLE_CONNECT_STRING: '172.22.3.94:1521/SAPBRIDGE',
    }

    expect(
      environmentSchema.safeParse({
        ...base,
        NODE_ENV: 'development',
        SAP_ODATA_BASE_URL: 'http://erpdev-gm.gamasap.com:8000',
        SAP_ORACLE_USERNAME: 'SAPBRIDGE_D',
        SAP_ORACLE_PASSWORD: 'secret',
      }).success,
    ).toBe(true)

    expect(
      environmentSchema.safeParse({
        ...base,
        NODE_ENV: 'development',
        SAP_ODATA_BASE_URL: 'https://erpprd.example.invalid',
      }).success,
    ).toBe(false)

    expect(
      environmentSchema.safeParse({
        ...base,
        NODE_ENV: 'development',
        SAP_ODATA_BASE_URL: 'http://erpdev-gm.gamasap.com:8000',
        SAP_ORACLE_USERNAME: 'SAPBRIDGE_P',
      }).success,
    ).toBe(false)

    expect(
      environmentSchema.safeParse({
        ...base,
        NODE_ENV: 'production',
        SAP_ODATA_BASE_URL: 'https://erpdev-gm.gamasap.com:8000',
        SAP_ORACLE_USERNAME: 'SAPBRIDGE_P',
        SAP_ORACLE_PASSWORD: 'secret',
      }).success,
    ).toBe(false)

    expect(
      environmentSchema.safeParse({
        ...base,
        NODE_ENV: 'production',
        SAP_ODATA_BASE_URL: 'https://erpprd-gm.gamasap.com:8443',
        SAP_ORACLE_USERNAME: 'SAPBRIDGE_D',
        SAP_ORACLE_PASSWORD: 'secret',
      }).success,
    ).toBe(false)

    expect(
      environmentSchema.safeParse({
        ...base,
        NODE_ENV: 'production',
        SAP_ODATA_BASE_URL: 'https://erpprd-gm.gamasap.com:8443',
        SAP_ORACLE_USERNAME: 'SAPBRIDGE_P',
        SAP_ORACLE_PASSWORD: 'secret',
      }).success,
    ).toBe(true)
  })

  it('enforces SAP ownership, account ownership, plant access and Logistics-only review', async () => {
    expect((await api('/documents').query({ reference: 'foreign-do' })).status).toBe(403)
    expect((await api('/references').query({ customerId: admin.user.id })).status).toBe(403)
    const outsider = await createTestUser('CUSTOMER')

    users.push(outsider.id)
    const outsiderCookie = cookieFrom(await login(outsider.username))

    const foreignRefs = fixtureReferences({
      id: outsider.id,
      username: outsider.username,
      role: 'CUSTOMER',
    })

    expect(
      (await api('/documents', outsiderCookie).query({ reference: foreignRefs[0] })).status,
    ).toBe(403)

    const row = await draft()

    expect((await api('/' + row.id, outsiderCookie)).status).toBe(404)
    expect((await post('/' + row.id + '/approve', approval(row))).status).toBe(403)

    await post('/' + row.id + '/cancel', {
      version: row.version,
      reason: 'Test complete',
    })
  })

  it('serializes competing reservations and excludes a draft’s previous quantities on edit', async () => {
    const doc = await document()

    const body = {
      lines: [
        {
          documentId: doc.id,
          variant: 'LCO',
          quantity: '60000',
          mediaTransport: 'T',
        },
      ],
    }

    const results = await Promise.all([post('', body), post('', body)])

    expect(results.map((result) => result.status).sort()).toEqual([201, 409])
    const row = results.find((result) => result.status === 201)!.body.data as JulRequestDetail

    const edited = await request(app)
      .put('/api/jul/' + row.id)
      .set('Cookie', cookie)
      .set('Origin', origin)
      .send({
        version: row.version,
        lines: [
          {
            ...body.lines[0],
            id: row.lines[0]!.id,
            quantity: '90000',
          },
        ],
      })

    expect(edited.status, JSON.stringify(edited.body)).toBe(200)

    const stale = await request(app)
      .put('/api/jul/' + row.id)
      .set('Cookie', cookie)
      .set('Origin', origin)
      .send({
        version: row.version,
        lines: body.lines,
      })

    expect(stale.status).toBe(409)

    await post('/' + row.id + '/cancel', {
      version: edited.body.data.version,
      reason: 'Release test reservation',
    })

    expect((await document()).availableQuantity).toBe('91000')
  })

  it('applies global holds and releases them with an audit reason', async () => {
    const doc = await document()

    expect(
      (
        await post(
          '/holds',
          {
            documentId: doc.id,
            quantity: '1000',
            reason: 'Reserve for planning',
          },
          admin.cookie,
        )
      ).status,
    ).toBe(200)

    expect((await document()).availableQuantity).toBe('90000')

    expect(
      (
        await post(
          '/holds',
          {
            documentId: doc.id,
            quantity: '0',
            reason: 'Release planning hold',
          },
          admin.cookie,
        )
      ).status,
    ).toBe(200)
  })

  it('offers only SAP-registered drivers and vehicles and saves exact SAP matches locally', async () => {
    await prisma.driver.deleteMany({
      where: {
        licenseNumber: {
          in: ['8800000000000001', '8800000000000002'],
        },
      },
    })

    await prisma.vehicle.deleteMany({
      where: {
        plateNumber: {
          in: ['B 1001 DEMO', 'B 1002 DEMO'],
        },
      },
    })

    await prisma.driver.upsert({
      where: { licenseNumber: 'LOCAL-SIM-9999' },
      create: {
        licenseNumber: 'LOCAL-SIM-9999',
        name: 'Local Registered Driver',
        isActive: true,
        inSap: false,
      },
      update: {
        name: 'Local Registered Driver',
        isActive: true,
        inSap: false,
      },
    })

    await prisma.vehicle.upsert({
      where: { plateNumber: 'B 9999 LOC' },
      create: {
        plateNumber: 'B 9999 LOC',
        isActive: true,
        inSap: false,
      },
      update: {
        isActive: true,
        inSap: false,
      },
    })

    const localDriver = {
      licenseNumber: 'LOCAL-SIM-9999',
      name: 'Local Registered Driver',
    }

    expect((await api('/drivers').query({ q: 'local' })).body.data).toEqual([])
    expect((await api('/vehicles').query({ q: '9999' })).body.data).toEqual([])

    await prisma.driver.update({
      where: { licenseNumber: 'LOCAL-SIM-9999' },
      data: { inSap: true },
    })

    await prisma.vehicle.update({
      where: { plateNumber: 'B 9999 LOC' },
      data: { inSap: true },
    })

    expect((await api('/drivers').query({ q: 'local' })).body.data).toContainEqual(localDriver)
    expect((await api('/vehicles').query({ q: '9999' })).body.data).toContain('B 9999 LOC')
    expect((await api('/drivers').query({ q: '8800' })).body.data).toEqual([])

    const sapDriver = await api('/drivers').query({ q: '8800000000000001' })

    expect(sapDriver.status).toBe(200)

    expect(sapDriver.body.data).toEqual([
      {
        licenseNumber: '8800000000000001',
        name: 'Demo Driver One',
      },
    ])

    expect(
      await prisma.driver.findUniqueOrThrow({
        where: { licenseNumber: '8800000000000001' },
      }),
    ).toMatchObject({
      inSap: true,
      sapLocation: 'PS1',
    })

    expect((await api('/drivers').query({ q: 'demo driver' })).body.data).toContainEqual({
      licenseNumber: '8800000000000001',
      name: 'Demo Driver One',
    })

    expect((await api('/vehicles').query({ q: 'b  1001 demo' })).body.data).toEqual(['B 1001 DEMO'])
    expect((await api('/vehicles').query({ q: '1001' })).body.data).toContain('B 1001 DEMO')

    const doc = await document()

    const created = await post('', {
      lines: [
        {
          documentId: doc.id,
          variant: 'LCO',
          quantity: '10',
          mediaTransport: 'T',
          driverLicenseNumber: 'LOCAL-SIM-9999',
          vehiclePlateNumber: 'B 9999 LOC',
          loadingDate: businessDate(),
        },
      ],
    })

    expect(created.status).toBe(201)
    const submitted = await submit(created.body.data as JulRequestDetail)

    expect(submitted.lines[0]).toMatchObject({
      driverLicenseNumber: 'LOCAL-SIM-9999',
      driverName: 'Local Registered Driver',
      vehiclePlateNumber: 'B 9999 LOC',
    })

    await post('/' + submitted.id + '/cancel', {
      version: submitted.version,
      reason: 'Cleanup local driver test',
    })
  })

  it('requires complete registered transport details at submission', async () => {
    const doc = await document()

    const row = (
      await post('', {
        lines: [
          {
            documentId: doc.id,
            variant: 'LCO',
            quantity: '1',
            mediaTransport: 'T',
          },
        ],
      })
    ).body.data as JulRequestDetail

    expect((await post('/' + row.id + '/submit', { version: row.version })).status).toBe(422)

    await post('/' + row.id + '/cancel', {
      version: row.version,
      reason: 'Incomplete test draft',
    })
  })

  it('creates confirmed loading notes with exact legacy staging fields and no persisted password', async () => {
    const row = await submit(await draft('100.7', refs[0], 2))
    const response = await post('/' + row.id + '/approve', approval(row), admin.cookie)

    expect(response.status, JSON.stringify(response.body)).toBe(200)
    const completed = response.body.data as JulRequestDetail

    expect(completed.status).toBe('COMPLETED')

    expect(completed.lines.every((line) => line.loadingNoteNumber?.startsWith('DEMO-JUL-'))).toBe(
      true,
    )

    expect(completed.lines.map((line) => line.quantity)).toEqual(['100', '100'])
    const stage = stagedRows.get(row.lines[0]!.id)!

    expect(stage.payload).toMatchObject({
      HEAD_ID: row.id,
      DET_ID: row.lines[0]!.id,
      POSNR: '000010',
      DOTYPE: 'S',
      ITEMRULE: '1B',
      PLN_LFIMG: '100',
      WANGKUTAN: '',
      DOPLINE: '0000',
      L_LFIMG: 0,
      OP_LFIMG: 0,
      DBWTAR: 'DEMO-FAC',
      RBWTAR_1: 'DEMO-OTH',
      USERSAP: admin.user.username,
      ISACTIVE: 'TRUE',
      ISRETRIVEDBYSAP: 'FALSE',
      FLAG: 'I',
    })

    const job = await prisma.julJob.findUniqueOrThrow({
      where: { id: completed.jobs[0]!.id },
    })

    expect(JSON.stringify(job)).not.toContain('request-only-secret')
    expect((await document()).availableQuantity).toBe('90800')
    expect((await post('/' + row.id + '/approve', approval(row), admin.cookie)).status).toBe(409)
    expect((await api('/' + row.id)).body.data.completedCount).toBe(2)
  })

  it('resumes interrupted staging without creating duplicate rows', async () => {
    const row = await submit(await draft('1'))

    const spy = vi
      .spyOn(staging, 'stage')
      .mockRejectedValueOnce(new Error('Simulated staging interruption'))

    const result = await post('/' + row.id + '/approve', approval(row), admin.cookie)

    expect(result.body.data.jobs[0]).toMatchObject({
      status: 'STAGE_FAILED',
      canResume: true,
    })

    const resumed = await post(
      `/${row.id}/jobs/${result.body.data.jobs[0].id}/resume`,
      { sapPassword: 'request-only-secret' },
      admin.cookie,
    )

    expect(resumed.body.data.status).toBe('COMPLETED')
    expect(stagedRows.has(row.lines[0]!.id)).toBe(true)
    spy.mockRestore()
  })

  it('reconciles ambiguous triggers without sending the mutating GET twice', async () => {
    const row = await submit(await draft('1', refs[3]))
    const spy = vi.spyOn(gateway, 'trigger').mockRejectedValueOnce(new Error('Simulated timeout'))
    const response = await post('/' + row.id + '/approve', approval(row), admin.cookie)

    expect(response.body.data.lines[0].status).toBe('SAP_UNKNOWN')
    const jobId = response.body.data.jobs[0].id as string

    await post(
      `/${row.id}/jobs/${jobId}/resume`,
      { sapPassword: 'request-only-secret' },
      admin.cookie,
    )

    expect(spy).toHaveBeenCalledTimes(1)

    setStageError([row.lines[0]!.id], 'Document is processed by another operator')

    expect((await post('/' + row.id + '/reconcile', {})).body.data.lines[0]).toMatchObject({
      status: 'SAP_RETRY',
      sapError: 'Document is processed by another operator',
    })

    await simulateCompletion(row.lines.map((line) => line.id))
    expect((await post('/' + row.id + '/reconcile', {})).body.data.status).toBe('COMPLETED')
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it('maps customer FRC to FRC to LCO and vendor STOs to FRC with the T/6A staging override', async () => {
    const frc = await document(refs[1])

    const line = {
      documentId: frc.id,
      quantity: '1',
      mediaTransport: 'T',
      driverLicenseNumber: '8800000000000001',
      vehiclePlateNumber: 'B 1001 DEMO',
      loadingDate: businessDate(),
    }

    expect(
      (
        await post('', {
          lines: [
            {
              ...line,
              variant: 'FRC',
            },
          ],
        })
      ).status,
    ).toBe(422)

    const created = await post('', {
      lines: [
        {
          ...line,
          variant: 'FRC_TO_LCO',
        },
      ],
    })

    expect(created.status, JSON.stringify(created.body)).toBe(201)
    const row = await submit(created.body.data as JulRequestDetail)
    const approved = await post('/' + row.id + '/approve', approval(row), admin.cookie)

    expect(approved.body.data.status, JSON.stringify(approved.body)).toBe('COMPLETED')
    const stage = stagedRows.get(row.lines[0]!.id)!

    expect(stage.payload).toMatchObject({
      EBELN_REF: '4500000001',
      DOTYPE: 'S',
      ITEMRULE: '6A',
    })

    const vendor = await createTestUser('VENDOR')

    users.push(vendor.id)
    for (const code of ['prereg:read', 'prereg:create', 'prereg:update'])
      await grant(vendor.role.id, code)

    await prisma.userPlant.create({
      data: {
        userId: vendor.id,
        plantId,
      },
    })

    const vendorCookie = cookieFrom(await login(vendor.username))

    const listed = await api('/references', vendorCookie).query({ sto: '4500000001' })

    expect(listed.status).toBe(403)
  })

  it('lists only downstream LCO/FRC delivery orders, as the legacy DO list did', async () => {
    expect((await api('/references')).body.data).toEqual(refs.slice(0, 4))
    expect((await api('/documents').query({ reference: refs[4] })).status).toBe(422)
  })

  it('requires a quantity of at least 1 and an active transport mode', async () => {
    const doc = await document()

    expect(doc.transportModes).toEqual([
      {
        code: 'T',
        name: 'Truck',
      },
    ])

    const line = {
      documentId: doc.id,
      variant: 'LCO',
      quantity: '1',
      mediaTransport: 'T',
    }

    expect(
      (
        await post('', {
          lines: [
            {
              ...line,
              quantity: '0.5',
            },
          ],
        })
      ).status,
    ).toBe(422)

    expect(
      (
        await post('', {
          lines: [
            {
              ...line,
              mediaTransport: 'V',
            },
          ],
        })
      ).status,
    ).toBe(422)
  })

  it('uses actual SAP quantity when non-zero, planned otherwise, and adds back deletions', async () => {
    const original = gateway.read.bind(gateway)

    const spy = vi
      .spyOn(gateway, 'read')
      .mockImplementation(async (entity, filter, owner, values = {}) =>
        values.reference === refs[1] && entity === 'OUTDELIVSet'
          ? [
              {
                PlnLfimg: '10000.000',
                LLfimg: '0.000',
                Zdconr: 'LN-PLANNED',
              },
              {
                PlnLfimg: '5000.000',
                LLfimg: '4800.500',
                Zdconr: 'LN-ACTUAL',
              },
            ]
          : values.reference === refs[1] && entity === 'DOTRXDELETESet'
            ? [{ PlnLfimg: '1000.000' }, { PlnLfimg: '250.250' }]
            : original(entity, filter, owner, values),
      )

    try {
      const doc = await document(refs[1])

      expect(doc).toMatchObject({
        sapUsedQuantity: '14800.5',
        deletedQuantity: '1250.25',
      })

      expect(quantity(doc.availableQuantity)).toBe(
        quantity('100000') -
          quantity('14800.5') +
          quantity('1250.25') -
          quantity(doc.reservedQuantity) -
          quantity(doc.heldQuantity),
      )
    } finally {
      spy.mockRestore()
    }
  })

  it('keeps "processed by" lines reserved for re-push and restages them with FLAG U', async () => {
    const row = await submit(await draft('1', refs[3]))

    const spy = vi.spyOn(gateway, 'trigger').mockImplementationOnce(async () => {
      setStageError(
        row.lines.map((line) => line.id),
        'DO 0000000004 is being processed by LOGUSER01',
      )
    })

    const first = (await post('/' + row.id + '/approve', approval(row), admin.cookie)).body
      .data as JulRequestDetail

    spy.mockRestore()

    expect(first.lines[0]).toMatchObject({
      status: 'SAP_RETRY',
      sapError: 'DO 0000000004 is being processed by LOGUSER01',
    })

    expect(first.status).toBe('SUBMITTED')
    expect(first.jobs[0]!.status).toBe('RETRY')
    const second = await post('/' + row.id + '/approve', approval(first), admin.cookie)

    expect(second.status, JSON.stringify(second.body)).toBe(200)
    expect(second.body.data.lines[0].status).toBe('COMPLETED')
    const stage = stagedRows.get(row.lines[0]!.id)!

    expect(stage.payload).toMatchObject({
      FLAG: 'U',
      ISRETRIVEDBYSAP: 'FALSE',
    })
  })

  it('expires old unprocessed and retryable lines', async () => {
    const row = await draft('1')
    const retry = await submit(await draft('1'))

    const spy = vi.spyOn(gateway, 'trigger').mockImplementationOnce(async () => {
      setStageError(
        retry.lines.map((line) => line.id),
        'Document is processed by another operator',
      )
    })

    await post('/' + retry.id + '/approve', approval(retry), admin.cookie)
    spy.mockRestore()

    await prisma.julLine.updateMany({
      where: {
        registrationId: {
          in: [row.id, retry.id],
        },
      },
      data: {
        loadingDate: new Date('2020-01-01'),
      },
    })

    await service.tick()
    expect((await api('/' + row.id)).body.data.status).toBe('EXPIRED')
    expect((await api('/' + retry.id)).body.data.lines[0].status).toBe('EXPIRED')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('validates multi-DO trip rules, requires whole-trip approval and stages one IS_MULTI row per DO', async () => {
    const firstDoc = await document(refs[0])
    const secondDoc = await document(refs[3])

    const frcDoc = await document(refs[1])

    const separate = {
      variant: 'LCO',
      mediaTransport: 'T',
      quantity: '1',
    }

    expect(
      (
        await post('', {
          lines: [
            {
              ...separate,
              documentId: firstDoc.id,
            },
            {
              ...separate,
              documentId: secondDoc.id,
            },
          ],
        })
      ).status,
    ).toBe(422)

    expect(
      (
        await post('', {
          isMulti: true,
          lines: [
            {
              ...separate,
              documentId: firstDoc.id,
            },
            {
              ...separate,
              documentId: frcDoc.id,
              variant: 'FRC_TO_LCO',
            },
          ],
        })
      ).status,
    ).toBe(422)

    const trip = {
      variant: 'LCO',
      mediaTransport: 'T',
      driverLicenseNumber: '8800000000000001',
      vehiclePlateNumber: 'B 1001 DEMO',
      loadingDate: businessDate(),
    }

    expect(
      (
        await post('', {
          isMulti: true,
          lines: [
            {
              ...trip,
              documentId: firstDoc.id,
              quantity: '10',
            },
          ],
        })
      ).status,
    ).toBe(422)

    expect(
      (
        await post('', {
          isMulti: true,
          lines: [
            {
              ...trip,
              documentId: firstDoc.id,
              quantity: '10',
            },
            {
              ...trip,
              documentId: firstDoc.id,
              quantity: '20',
            },
          ],
        })
      ).status,
    ).toBe(422)

    expect(
      (
        await post('', {
          isMulti: true,
          lines: [
            {
              ...trip,
              documentId: firstDoc.id,
              quantity: '10',
            },
            {
              ...trip,
              documentId: secondDoc.id,
              quantity: '20',
              vehiclePlateNumber: 'B 1002 DEMO',
            },
          ],
        })
      ).status,
    ).toBe(422)

    const created = await post('', {
      isMulti: true,
      lines: [
        {
          ...trip,
          documentId: firstDoc.id,
          quantity: '10.8',
        },
        {
          ...trip,
          documentId: secondDoc.id,
          quantity: '20.4',
        },
      ],
    })

    expect(created.status, JSON.stringify(created.body)).toBe(201)
    expect(created.body.data.isMulti).toBe(true)
    const submitted = await submit(created.body.data as JulRequestDetail)

    expect(
      (
        await post(
          '/' + submitted.id + '/approve',
          approval(submitted, [submitted.lines[0]!]),
          admin.cookie,
        )
      ).status,
    ).toBe(422)

    const approved = await post('/' + submitted.id + '/approve', approval(submitted), admin.cookie)

    expect(approved.status, JSON.stringify(approved.body)).toBe(200)

    expect(approved.body.data).toMatchObject({
      isMulti: true,
      status: 'COMPLETED',
      completedCount: 2,
    })

    for (const line of submitted.lines) {
      const stage = stagedRows.get(line.id)!

      expect(stage.payload).toMatchObject({
        HEAD_ID: submitted.id,
        DET_ID: line.id,
        VBELN_REF: line.referenceDocument,
        IS_MULTI: 1,
      })
    }
  })
})
