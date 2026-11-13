import request from 'supertest'
import type { RegistrationCreateInput } from '@awb/contracts'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type TestAgent from 'supertest/lib/agent'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import {
  createOperator,
  DRIVER_PHOTO,
  ORIGIN,
  resetOperators,
  seedSapMasters,
  signIn,
} from './helpers'

let cards = 0

function payload(overrides: Partial<RegistrationCreateInput> = {}): RegistrationCreateInput {
  return {
    cardNumber: `CARD-${++cards}`,
    driverPhoto: DRIVER_PHOTO,
    weighingType: '2X',
    plateNumber: 'B 9005 SDC',
    transporterCode: 'BMS',
    transporterName: 'Bina Mitra Sejahtera',
    licenseNumber: '000815290110',
    driverName: 'AGIL HASAN',
    tankerNumber: '',
    passengerCount: 1,
    passengerNames: 'Kernet',
    destinations: [
      {
        code: 'REF',
        name: 'REFINERY',
      },
      {
        code: 'KCP',
        name: '',
      },
    ],
    deliveryNote: 'SJ-001',
    sealNumber: 'S-1, S-2',
    ticketRemark: 'PENERIMAAN CPO',
    containers: [
      {
        containerNumber: 'TEMU1234567',
        sealNumber: 'SEAL-9',
      },
    ],
    needsContainerCheck: true,
    hasOtherPartyWeight: true,
    otherPartyReference: 'OP-77',
    otherPartyWeighedAt: '2026-11-11T08:30:00+07:00',
    otherPartyGross: '30000',
    otherPartyTare: '10000.5',
    dos: [
      {
        transactionCode: 'bel',
        transactionName: 'PEMBELIAN',
        doNumber: 'SK01II02-00139',
        commodityCode: '8010-10.11102',
        commodityName: 'CRUDE PALM OIL FFA 3.5-5',
        contractNumber: 'SK01II02-00139',
        relationCode: 'AT11002698',
        relationName: 'PT. SAWIT MAKMUR SEJAHTERA',
        transporterCode: 'BMS',
        estate: 'PLANT EUP KIJING',
        factoryNet: '20000',
        deductions: [
          {
            code: 'SMP',
            name: 'Sampah',
            percent: '0.5',
            deductionKg: '100',
          },
        ],
      },
      {
        transactionCode: 'BEL',
        doNumber: 'DO-4',
        loadingNoteNumber: 'LN-1',
        loadingNoteItem: '10',
        quantityKg: '5000',
      },
    ],
    qualities: [
      {
        code: 'FFA',
        name: 'Free Fatty Acid',
        sapSpecification: '5.000',
        estateValue: '4.1',
      },
    ],
    ...overrides,
  }
}

describe('gate registrations', () => {
  let agent: TestAgent

  beforeAll(async () => {
    await resetOperators('regtest_')
    await prisma.registration.deleteMany({})

    await prisma.counter.deleteMany({
      where: { key: 'registration' },
    })

    await seedSapMasters()
    await createOperator('regtest_gate')
    agent = await signIn('regtest_gate')
  })

  afterAll(() => resetOperators('regtest_'))

  it('requires a signed-in operator and the console origin', async () => {
    expect((await request(app).get('/api/registrations')).status).toBe(401)

    const res = await agent
      .post('/api/registrations')
      .set('Origin', 'http://evil.example')
      .send(payload())

    expect(res.status).toBe(403)
  })

  it('applies the WB.NET required fields', async () => {
    const empty = await agent.post('/api/registrations').set('Origin', ORIGIN).send({})

    expect(empty.status).toBe(422)
    expect(empty.body.details.plateNumber).toEqual(['Enter the truck plate'])
    expect(empty.body.details.licenseNumber).toEqual(['Pick the driver'])
    expect(empty.body.details.dos).toEqual(['Add at least one DO'])
    expect(empty.body.details.destinations).toEqual(['Add at least one destination'])
    expect(empty.body.details.driverPhoto).toEqual(['Take a photo of the driver'])

    expect(empty.body.details.cardNumber).toEqual([
      'Tap the RFID card on the reader or type its number',
    ])

    const notFromCamera = await agent
      .post('/api/registrations')
      .set('Origin', ORIGIN)
      .send(payload({ driverPhoto: 'data:image/png;base64,iVBORw0KGgo=' }))

    expect(notFromCamera.status).toBe(422)

    expect(notFromCamera.body.details.driverPhoto).toEqual([
      'Take the driver photo with the camera',
    ])

    const disguised = await agent
      .post('/api/registrations')
      .set('Origin', ORIGIN)
      .send(payload({ driverPhoto: 'data:image/jpeg;base64,aGVsbG8gd29ybGQ=' }))

    expect(disguised.status).toBe(422)

    expect(disguised.body.details.driverPhoto).toEqual([
      'The driver photo is not a readable JPEG; take it again',
    ])

    const noOtherParty = await agent
      .post('/api/registrations')
      .set('Origin', ORIGIN)
      .send(
        payload({
          otherPartyGross: '',
        }),
      )

    expect(noOtherParty.status).toBe(422)

    expect(noOtherParty.body.details.otherPartyGross).toEqual([
      'Enter the gross weight from the other-party ticket',
    ])

    const julWithoutNote = await agent
      .post('/api/registrations')
      .set('Origin', ORIGIN)
      .send(
        payload({
          dos: [
            {
              transactionCode: 'JUL',
              doNumber: 'DO-3',
            },
          ],
        }),
      )

    expect(julWithoutNote.status).toBe(422)
    expect(julWithoutNote.body.details.dos).toEqual(['Enter the loading note for a sale (JUL)'])

    const mixed = await agent
      .post('/api/registrations')
      .set('Origin', ORIGIN)
      .send(
        payload({
          dos: [
            {
              transactionCode: 'BEL',
              doNumber: 'SK01II02-00139',
            },
            {
              transactionCode: 'JUL',
              doNumber: 'DO-2',
              loadingNoteNumber: 'LN-1',
            },
          ],
        }),
      )

    expect(mixed.status).toBe(422)

    expect(mixed.body.details.dos).toEqual([
      'All DOs on one truck must have the same transaction type',
    ])
  })

  it('stores the registration with all its lines and numbers them in sequence', async () => {
    const first = await agent.post('/api/registrations').set('Origin', ORIGIN).send(payload())

    expect(first.status).toBe(201)
    expect(first.body.data.number).toMatch(/^GP\d{7}$/)

    const second = await agent
      .post('/api/registrations')
      .set('Origin', ORIGIN)
      .send(
        payload({
          plateNumber: 'KB 1234 XY',
          hasOtherPartyWeight: false,
          otherPartyGross: '',
        }),
      )

    expect(second.status).toBe(201)

    expect(Number(second.body.data.number.slice(2))).toBe(
      Number(first.body.data.number.slice(2)) + 1,
    )

    const stored = await prisma.registration.findUniqueOrThrow({
      where: { id: first.body.data.id },
      include: {
        createdBy: true,
        destinations: {
          orderBy: { lineNumber: 'asc' },
        },
        containers: true,
        dos: {
          orderBy: { lineNumber: 'asc' },
          include: { deductions: true },
        },
        qualities: true,
      },
    })

    expect(stored).toMatchObject({
      flowCode: 'BEL',
      stageCode: 'wb_in',
      status: 'ACTIVE',
      plateNumber: 'B 9005 SDC',
      tankerNumber: null,
      referenceNumber: null,
      needsContainerCheck: true,
      otherPartyReference: 'OP-77',
    })

    expect(stored.createdBy.username).toBe('regtest_gate')
    expect(stored.otherPartyNet?.toString()).toBe('19999.5')
    expect(stored.otherPartyWeighedAt?.toISOString()).toBe('2026-11-11T01:30:00.000Z')

    expect(stored.destinations.map((row) => [row.code, row.name])).toEqual([
      ['REF', 'REFINERY'],
      ['KCP', null],
    ])

    expect(stored.containers[0]).toMatchObject({
      containerNumber: 'TEMU1234567',
      sealNumber: 'SEAL-9',
    })

    expect(stored.dos.map((row) => row.transactionCode)).toEqual(['BEL', 'BEL'])
    expect(stored.dos[0]?.factoryNet?.toString()).toBe('20000')

    expect(stored.dos[0]?.deductions[0]).toMatchObject({
      code: 'SMP',
      isReturn: false,
    })

    expect(stored.dos[0]?.deductions[0]?.percent?.toString()).toBe('0.5')
    expect(stored.dos[1]?.loadingNoteNumber).toBe('LN-1')

    expect(stored.qualities[0]).toMatchObject({
      code: 'FFA',
      factoryValue: null,
    })

    const withoutOtherParty = await prisma.registration.findUniqueOrThrow({
      where: { id: second.body.data.id },
    })

    expect(withoutOtherParty.otherPartyReference).toBeNull()
    expect(withoutOtherParty.otherPartyNet).toBeNull()
  })

  it('lists the stage of each truck, filters by phase and counts every phase', async () => {
    const created = await prisma.registration.findMany({
      orderBy: { number: 'asc' },
    })

    await prisma.registration.update({
      where: { id: created[0]!.id },
      data: {
        stageCode: 'regist_out',
        status: 'COMPLETED',
        checkedOutAt: new Date(),
        checkedOutById: created[0]!.createdById,
      },
    })

    const create = (overrides: Partial<RegistrationCreateInput>) =>
      agent
        .post('/api/registrations')
        .set('Origin', ORIGIN)
        .send(
          payload({
            hasOtherPartyWeight: false,
            otherPartyGross: '',
            ...overrides,
          }),
        )

    const cancelled = await create({ plateNumber: 'DA 5555 ZZ' })

    await prisma.registration.update({
      where: { id: cancelled.body.data.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: created[0]!.createdById,
        cancelReason: 'Test',
      },
    })

    const onHold = await create({ plateNumber: 'DA 5555 ZZ' })

    await prisma.registration.update({
      where: { id: onHold.body.data.id },
      data: {
        stageCode: 'lab',
        status: 'ON_HOLD',
      },
    })

    const fame = await create({
      dos: [
        {
          transactionCode: 'BEL',
          doNumber: 'DO-FAME',
        },
      ],
    })

    expect(fame.status).toBe(201)

    await prisma.registration.update({
      where: { id: fame.body.data.id },
      data: { stageCode: 'wb_out' },
    })

    const waiting = await agent.get('/api/registrations?phase=WB_IN')

    expect(waiting.status).toBe(200)
    expect(waiting.body.data.total).toBe(1)

    expect(waiting.body.data.items[0]).toMatchObject({
      plateNumber: 'KB 1234 XY',
      status: 'ACTIVE',
      flow: {
        code: 'BEL',
        name: 'Purchase',
      },
      stage: {
        code: 'wb_in',
        name: 'Weighbridge In',
        step: 2,
        steps: 7,
      },
      createdBy: 'Operator regtest_gate',
      checkedOutBy: null,
    })

    expect(waiting.body.data.items[0]).toMatchObject({
      transporterName: 'Bina Mitra Sejahtera',
      weighingType: '2X',
      otherPartyNet: null,
    })

    expect(waiting.body.data.items[0].dos[0]).toMatchObject({
      doNumber: 'SK01II02-00139',
      transactionCode: 'BEL',
      commodityName: 'CRUDE PALM OIL FFA 3.5-5',
      relationName: 'PT. SAWIT MAKMUR SEJAHTERA',
    })

    expect(waiting.body.data.items[0].destinations.length).toBeGreaterThan(0)

    expect(waiting.body.data.counts).toEqual({
      all: 5,
      WB_IN: 1,
      PROCESS: 1,
      WB_OUT: 1,
      REGIST_OUT: 0,
      COMPLETED: 1,
      CANCELLED: 1,
    })

    const inProcess = await agent.get('/api/registrations?phase=PROCESS')

    expect(inProcess.body.data.items).toHaveLength(1)

    expect(inProcess.body.data.items[0]).toMatchObject({
      status: 'ON_HOLD',
      stage: { code: 'lab' },
    })

    const weighingOut = await agent.get('/api/registrations?phase=WB_OUT')

    expect(weighingOut.body.data.items[0]).toMatchObject({
      flow: { code: 'FAME' },
      stage: {
        code: 'wb_out',
        step: 3,
        steps: 4,
      },
    })

    const everything = await agent.get('/api/registrations?sortBy=number&sortDirection=asc')

    expect(everything.body.data.items.map((row: { status: string }) => row.status)).toEqual([
      'COMPLETED',
      'ACTIVE',
      'CANCELLED',
      'ON_HOLD',
      'ACTIVE',
    ])

    expect(everything.body.data.items[0].checkedOutBy).toBe('Operator regtest_gate')
    expect(everything.body.data.items[2].cancelledBy).toBe('Operator regtest_gate')

    const search = await agent.get('/api/registrations?search=5555')

    expect(search.body.data.items.map((row: { plateNumber: string }) => row.plateNumber)).toEqual([
      'DA 5555 ZZ',
      'DA 5555 ZZ',
    ])

    expect(search.body.data.counts.all).toBe(2)

    const future = await agent.get(
      `/api/registrations?from=${encodeURIComponent(new Date(Date.now() + 86_400_000).toISOString())}`,
    )

    expect(future.body.data.total).toBe(0)
    expect(future.body.data.counts.all).toBe(0)

    const paged = await agent.get('/api/registrations?limit=2&page=3')

    expect(paged.body.data.items).toHaveLength(1)
    expect(paged.body.data.total).toBe(5)

    const cancelledOnly = await agent.get('/api/registrations?phase=CANCELLED')

    expect(cancelledOnly.body.data.items.map((row: { id: string }) => row.id)).toEqual([
      cancelled.body.data.id,
    ])
  })

  it('needs a plant flow for the transaction type', async () => {
    const res = await agent
      .post('/api/registrations')
      .set('Origin', ORIGIN)
      .send(
        payload({
          dos: [
            {
              transactionCode: 'RVS',
              doNumber: 'DO-RVS',
            },
          ],
        }),
      )

    expect(res.status).toBe(422)
    expect(res.body.details.dos).toEqual(['No plant flow is set up for transaction type RVS'])
  })

  it('only accepts codes from the SAP masters and takes the DO details from the register', async () => {
    await prisma.vehicle.upsert({
      where: {
        plateNumber_source: {
          plateNumber: 'PR 1111 EG',
          source: 'PREREG',
        },
      },
      create: {
        plateNumber: 'PR 1111 EG',
        source: 'PREREG',
      },
      update: {},
    })

    const unknown = await agent
      .post('/api/registrations')
      .set('Origin', ORIGIN)
      .send(
        payload({
          plateNumber: 'PR 1111 EG',
          licenseNumber: '999999',
          transporterCode: 'NOPE',
          tankerNumber: 'TK-X',
          destinations: [
            {
              code: 'XXX',
              name: '',
            },
          ],
          dos: [
            {
              transactionCode: 'BEL',
              doNumber: 'NOT-A-DO',
            },
            {
              transactionCode: 'BEL',
              doNumber: 'DO-CLOSED',
            },
          ],
        }),
      )

    expect(unknown.status).toBe(422)

    expect(unknown.body.details).toEqual({
      plateNumber: ['Truck plate is not in the SAP truck master'],
      licenseNumber: ['Driver licence is not in the SAP driver master'],
      transporterCode: ['Transporter is not in the SAP transporter master'],
      tankerNumber: ['Tanker is not in the SAP tanker master'],
      destinations: ['Destination XXX is not in the SAP destination master'],
      dos: ['DO NOT-A-DO is not in the SAP DO register', 'DO DO-CLOSED is closed'],
    })

    const saleByContract = await agent
      .post('/api/registrations')
      .set('Origin', ORIGIN)
      .send(
        payload({
          dos: [
            {
              transactionCode: 'BEL',
              doNumber: 'DO-2',
            },
          ],
        }),
      )

    expect(saleByContract.status).toBe(422)
    expect(saleByContract.body.details.dos).toEqual(['Enter the loading note for a sale (JUL)'])

    const filled = await agent
      .post('/api/registrations')
      .set('Origin', ORIGIN)
      .send(
        payload({
          plateNumber: 'kb  1234 xy',
          driverName: 'Someone else',
          dos: [
            {
              transactionCode: 'JUL',
              doNumber: 'SK01II02-00139',
              commodityCode: 'WRONG',
              relationName: 'Wrong relation',
              loadingNoteNumber: 'LN-9',
            },
          ],
        }),
      )

    expect(filled.status).toBe(201)

    const stored = await prisma.registration.findUniqueOrThrow({
      where: { id: filled.body.data.id },
      include: { dos: true },
    })

    expect(stored).toMatchObject({
      plateNumber: 'KB 1234 XY',
      driverName: 'AGIL HASAN',
    })

    expect(stored.dos[0]).toMatchObject({
      transactionCode: 'BEL',
      transactionName: 'PEMBELIAN',
      commodityCode: '8010-10.11102',
      commodityName: 'CRUDE PALM OIL FFA 3.5-5',
      contractNumber: 'SK01II02-00139',
      relationCode: 'AT11002698',
      relationName: 'PT. SAWIT MAKMUR SEJAHTERA',
      transporterCode: 'BMS',
      estate: 'PLANT EUP KIJING',
      piNumber: 'PI-7',
    })
  })

  it('keeps a card with one truck until it leaves and stores the driver photo', async () => {
    const save = (cardNumber: string) =>
      agent
        .post('/api/registrations')
        .set('Origin', ORIGIN)
        .send(
          payload({
            cardNumber,
            hasOtherPartyWeight: false,
            otherPartyGross: '',
          }),
        )

    const first = await save(' rfid-77 ')

    expect(first.status).toBe(201)

    const held = await agent.get('/api/registrations/cards/rfid-77')

    expect(held.body.data).toEqual({
      cardNumber: 'RFID-77',
      heldBy: {
        id: first.body.data.id,
        number: first.body.data.number,
        plateNumber: 'B 9005 SDC',
      },
    })

    const taken = await save('RFID-77')

    expect(taken.status).toBe(422)

    expect(taken.body.details.cardNumber).toEqual([
      `Card RFID-77 is still with ${first.body.data.number} (B 9005 SDC); finish or cancel that registration first`,
    ])

    await prisma.registration.update({
      where: { id: first.body.data.id },
      data: {
        stageCode: 'regist_out',
        status: 'COMPLETED',
      },
    })

    expect((await agent.get('/api/registrations/cards/RFID-77')).body.data.heldBy).toBeNull()
    expect((await save('RFID-77')).status).toBe(201)

    const photo = await agent
      .get(`/api/registrations/${first.body.data.id}/driver-photo`)
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = []

        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => done(null, Buffer.concat(chunks)))
      })

    expect(photo.status).toBe(200)
    expect(photo.headers['content-type']).toBe('image/jpeg')
    expect(Buffer.compare(photo.body, Buffer.from(DRIVER_PHOTO.split(',')[1]!, 'base64'))).toBe(0)

    expect(
      (await request(app).get(`/api/registrations/${first.body.data.id}/driver-photo`)).status,
    ).toBe(401)

    expect((await agent.get('/api/registrations/nope/driver-photo')).status).toBe(404)

    const listed = await agent.get('/api/registrations?search=RFID-77')

    expect(listed.body.data.items).toHaveLength(2)

    expect(listed.body.data.items[0]).toMatchObject({
      cardNumber: 'RFID-77',
      hasDriverPhoto: true,
    })
  })
})
