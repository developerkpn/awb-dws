import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type TestAgent from 'supertest/lib/agent'
import app from '../src/app'
import { env } from '../src/config/env'
import { prisma } from '../src/config/prisma'
import { createOperator, ORIGIN, resetOperators, seedSapMasters, signIn } from './helpers'

const odata = (results: object[]) =>
  new Response(
    JSON.stringify({
      d: { results },
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  )

describe('plant master data', () => {
  let operator: TestAgent
  let admin: TestAgent
  const original = { ...env }

  beforeAll(async () => {
    await resetOperators('mastertest_')
    await prisma.masterPull.deleteMany({})
    await seedSapMasters()

    await prisma.vehicle.upsert({
      where: {
        plateNumber_source: {
          plateNumber: 'PR 2222 EG',
          source: 'PREREG',
        },
      },
      create: {
        plateNumber: 'PR 2222 EG',
        source: 'PREREG',
      },
      update: {},
    })

    await createOperator('mastertest_gate')
    await createOperator('mastertest_admin', { role: 'ADMIN' })
    operator = await signIn('mastertest_gate')
    admin = await signIn('mastertest_admin')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.assign(env, original)
  })

  afterAll(() => resetOperators('mastertest_'))

  it('needs a session and lists the status of every master', async () => {
    expect((await request(app).get('/api/masters')).status).toBe(401)

    const res = await operator.get('/api/masters')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(11)

    const byKind = Object.fromEntries(res.body.data.map((row: { kind: string }) => [row.kind, row]))

    expect(byKind.vehicle).toMatchObject({
      sapAvailable: true,
      lastBackfilledAt: expect.any(String),
    })

    expect(byKind.relation.sapAvailable).toBe(true)
    expect(byKind.driver.sapAvailable).toBe(false)
    expect(byKind.contract.sapAvailable).toBe(false)

    const sapVehicles = await prisma.vehicle.count({
      where: {
        source: 'SAP',
        isActive: true,
      },
    })

    expect(byKind.vehicle.rowCount).toBe(sapVehicles)
  })

  it('lists only active SAP rows, with search and paging', async () => {
    const vehicles = await operator.get('/api/masters/vehicle?search=1234 XY')

    expect(vehicles.status).toBe(200)

    expect(vehicles.body.data.items).toEqual([
      expect.objectContaining({
        plateNumber: 'KB 1234 XY',
        transporterCode: 'BMS',
      }),
    ])

    expect(vehicles.body.data.status.kind).toBe('vehicle')

    const prereg = await operator.get('/api/masters/vehicle?search=PR 2222')

    expect(prereg.body.data.total).toBe(0)

    const paged = await operator.get('/api/masters/destination?limit=1&page=2')

    expect(paged.body.data.total).toBeGreaterThanOrEqual(2)
    expect(paged.body.data.items).toHaveLength(1)

    expect((await operator.get('/api/masters/unknown')).status).toBe(404)
  })

  it('returns DOs with the names of their codes and their quality specs', async () => {
    const res = await operator.get('/api/masters/contract?search=SK01II02-00139')

    expect(res.body.data.items[0]).toMatchObject({
      doNumber: 'SK01II02-00139',
      transactionCode: 'BEL',
      transactionName: 'PEMBELIAN',
      commodityName: 'CRUDE PALM OIL FFA 3.5-5',
      relationName: 'PT. SAWIT MAKMUR SEJAHTERA',
      estateName: 'PLANT EUP KIJING',
      quantityKg: '250000',
      isClosed: false,
      qualities: [
        {
          sapCode: 'FFA',
          value: '5.000',
        },
      ],
    })
  })

  it('pulls only for admins and only masters SAP serves', async () => {
    const asOperator = await operator.post('/api/masters/vehicle/pull').set('Origin', ORIGIN)

    expect(asOperator.status).toBe(403)

    const unavailable = await admin.post('/api/masters/contract/pull').set('Origin', ORIGIN)

    expect(unavailable.status).toBe(409)
    expect(unavailable.body.error).toBe('SAP service for contract is not available yet')
  })

  it('pulls trucks for this plant and buyers/sellers from SAP without blanking backfilled fields', async () => {
    Object.assign(env, {
      SAP_SERVICE_USERNAME: 'tester',
      SAP_SERVICE_PASSWORD: 'secret',
      SITE_WB_LOCATION: 'EU23',
    })

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)

      if (url.includes('/TRUCKSet'))
        return odata([
          {
            Nnopolisi: ' kb 1234 xy',
            ZwbLoc: 'EU23',
          },
          {
            Nnopolisi: 'KT 9 NEW',
            ZwbLoc: 'EU23',
          },
          {
            Nnopolisi: 'OTHER 1',
            ZwbLoc: 'PS1',
          },
        ])

      if (url.includes('/KUNNRSet'))
        return odata([
          {
            Kunnr: 'CU00010000',
            Name1: 'CUSTOMER ONE',
            Ort01: 'PONTIANAK',
          },
        ])

      if (url.includes('/LIFNRSet'))
        return odata([
          {
            Lifnr: 'AT21000006',
            Name1: 'JATIMJAYA PERKASA PT.',
          },
        ])

      return new Response('not found', { status: 404 })
    })

    const vehicles = await admin.post('/api/masters/vehicle/pull').set('Origin', ORIGIN)

    expect(vehicles.status).toBe(200)

    expect(vehicles.body.data).toMatchObject({
      kind: 'vehicle',
      lastPullStatus: 'SUCCESS',
      lastPullRowCount: 2,
    })

    const existing = await prisma.vehicle.findFirstOrThrow({
      where: {
        plateNumber: 'KB 1234 XY',
        source: 'SAP',
      },
    })

    expect(existing.transporterCode).toBe('BMS')

    expect(
      await prisma.vehicle.count({
        where: {
          plateNumber: {
            in: ['KT 9 NEW', 'OTHER 1'],
          },
          source: 'SAP',
        },
      }),
    ).toBe(1)

    const relations = await admin.post('/api/masters/relation/pull').set('Origin', ORIGIN)

    expect(relations.body.data.lastPullRowCount).toBe(2)

    const customer = await prisma.relation.findFirstOrThrow({
      where: {
        code: 'CU00010000',
        source: 'SAP',
      },
    })

    expect(customer).toMatchObject({
      type: 'B',
      city: 'PONTIANAK',
    })

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('ZwbLoc+eq+%27EU23%27')
  })

  it('records a failed pull', async () => {
    Object.assign(env, {
      SAP_SERVICE_USERNAME: 'tester',
      SAP_SERVICE_PASSWORD: 'secret',
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 500 }))

    const res = await admin.post('/api/masters/relation/pull').set('Origin', ORIGIN)

    expect(res.status).toBe(502)

    const status = await operator.get('/api/masters')

    expect(status.body.data.find((row: { kind: string }) => row.kind === 'relation')).toMatchObject(
      {
        lastPullStatus: 'FAILED',
        lastPullError: 'SAP request failed (HTTP 500)',
      },
    )
  })
})
