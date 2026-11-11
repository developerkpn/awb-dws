import ExcelJS from 'exceljs'
import request, { type Response } from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { createTestUser, cookieFrom, grant, login } from './helpers'

type TestUser = Awaited<ReturnType<typeof createTestUser>>

let adminUser: TestUser
let logisticUser: TestUser
let commercialUser: TestUser
let commercialNoPlant: TestUser
let customer1: TestUser
let customer2: TestUser
let vendor1: TestUser
let vendor2: TestUser
let intercoUser: TestUser
let noReadUser: TestUser

let adminCookie = ''
let logisticCookie = ''
let commercialCookie = ''
let commercialNoPlantCookie = ''
let customer1Cookie = ''
let vendor1Cookie = ''
let intercoCookie = ''
let noReadCookie = ''

let plantAlphaId = ''
let plantBetaId = ''

const createdUserIds: string[] = []
const createdPlantIds: string[] = []
const createdJulDocIds: string[] = []
const createdJulRegIds: string[] = []
const createdBelDocIds: string[] = []
const createdBelRegIds: string[] = []

function parseBinary(res: Response, callback: (err: Error | null, data: Buffer) => void) {
  const chunks: Buffer[] = []

  res.on('data', (chunk: Buffer) => chunks.push(chunk))
  res.on('end', () => callback(null, Buffer.concat(chunks)))
  res.on('error', (error: Error) => callback(error, Buffer.alloc(0)))
}

async function seedJulRow(input: {
  customerId: string
  plantId: string
  sapPlantCode: string
  number: string
  referenceDocument: string
  stoNumber: string | null
  submittedAt: Date
  loadingDate: Date | null
  driverLicenseNumber: string
  driverName: string
  vehiclePlateNumber: string
  mediaTransport: string
  quantity: string
  uom: string
  status: string
  loadingNoteNumber: string | null
}) {
  const doc = await prisma.julDocument.create({
    data: {
      customerId: input.customerId,
      referenceDocument: input.referenceDocument,
      providerMode: 'live',
      plantId: input.plantId,
      snapshot: {
        referenceDocument: input.referenceDocument,
        contractNumber: 'CON-' + input.referenceDocument,
        material: '8000001001',
        description: 'Report Test Material',
        uom: input.uom,
        sapPlant: input.sapPlantCode,
        company: input.sapPlantCode.slice(0, 2),
        incoterm1: 'LCO',
        incoterm2: 'LOC',
        itemRule: '01',
        invoiceType: 'STD',
        invoiceToleranceUpper: '0',
        invoiceToleranceLower: '0',
        contractQuantity: '5000',
        sapUsedQuantity: '0',
        deletedQuantity: '0',
        observedLoadingNotes: [],
        paid: true,
        unpaidAmount: '0',
        stoNumber: input.stoNumber,
        transportType: input.mediaTransport,
        buyerReference: null,
        buyerName: null,
      },
    },
  })

  createdJulDocIds.push(doc.id)

  const reg = await prisma.julRegistration.create({
    data: {
      number: input.number,
      customerId: input.customerId,
      createdById: input.customerId,
      providerMode: 'live',
      status: input.status,
      submittedAt: input.submittedAt,
      lines: {
        create: {
          documentId: doc.id,
          documentSnapshot: doc.snapshot as object,
          variant: 'LCO',
          stoNumber: input.stoNumber,
          driverLicenseNumber: input.driverLicenseNumber,
          driverName: input.driverName,
          vehiclePlateNumber: input.vehiclePlateNumber,
          quantity: input.quantity,
          loadingDate: input.loadingDate,
          mediaTransport: input.mediaTransport,
          status: input.status,
          loadingNoteNumber: input.loadingNoteNumber,
        },
      },
    },
  })

  createdJulRegIds.push(reg.id)

  return reg
}

async function seedBelRow(input: {
  vendorId: string
  vendorCode: string
  plantId: string
  sapPlantCode: string
  number: string
  poNumber: string
  poItem: string
  submittedAt: Date | null
  loadingDate: Date | null
  driverLicenseNumber: string
  driverName: string
  vehiclePlateNumber: string
  mediaTransport: string
  quantity: string
  uom: string
  status: string
}) {
  const doc = await prisma.belDocument.create({
    data: {
      vendorId: input.vendorId,
      poNumber: input.poNumber,
      poItem: input.poItem,
      plantId: input.plantId,
      snapshot: {
        vendorCode: input.vendorCode,
        poType: 'ZM10',
        poNumber: input.poNumber,
        poItem: input.poItem,
        material: '8000001001',
        description: 'BEL Report Material',
        uom: input.uom,
        sapPlant: input.sapPlantCode,
        incoterm1: 'FRC',
        orderedQuantity: '1000',
        sapReceivedQuantity: '0',
        receivedUom: input.uom,
        sapShippedQuantity: '0',
        shippedUom: input.uom,
        completed: false,
      },
    },
  })

  createdBelDocIds.push(doc.id)

  const reg = await prisma.belRegistration.create({
    data: {
      number: input.number,
      vendorId: input.vendorId,
      createdById: input.vendorId,
      status: input.status,
      submittedAt: input.submittedAt,
      lines: {
        create: {
          documentId: doc.id,
          documentSnapshot: doc.snapshot as object,
          driverLicenseNumber: input.driverLicenseNumber,
          driverName: input.driverName,
          vehiclePlateNumber: input.vehiclePlateNumber,
          quantity: input.quantity,
          loadingDate: input.loadingDate,
          mediaTransport: input.mediaTransport,
          status: input.status,
        },
      },
    },
  })

  createdBelRegIds.push(reg.id)

  return reg
}

beforeAll(async () => {
  const plantAlpha = await prisma.plant.create({
    data: {
      code: 'RPT-ALPHA-' + Date.now(),
      name: 'Report Alpha Plant',
      sapPlantCode: '3711',
      companyGroup: 'DOWNSTREAM',
      isActive: true,
    },
  })

  const plantBeta = await prisma.plant.create({
    data: {
      code: 'RPT-BETA-' + Date.now(),
      name: 'Report Beta Plant',
      sapPlantCode: '3712',
      companyGroup: 'DOWNSTREAM',
      isActive: true,
    },
  })

  plantAlphaId = plantAlpha.id
  plantBetaId = plantBeta.id
  createdPlantIds.push(plantAlphaId, plantBetaId)

  adminUser = await createTestUser('ADMIN')
  logisticUser = await createTestUser('LOGISTIC')
  commercialUser = await createTestUser('COMMERCIAL')
  commercialNoPlant = await createTestUser('COMMERCIAL')
  customer1 = await createTestUser('CUSTOMER')
  customer2 = await createTestUser('CUSTOMER')
  vendor1 = await createTestUser('VENDOR')
  vendor2 = await createTestUser('VENDOR')
  intercoUser = await createTestUser('INTERCO')
  noReadUser = await createTestUser('REPORT_NO_PERM')

  createdUserIds.push(
    adminUser.id,
    logisticUser.id,
    commercialUser.id,
    commercialNoPlant.id,
    customer1.id,
    customer2.id,
    vendor1.id,
    vendor2.id,
    intercoUser.id,
    noReadUser.id,
  )

  for (const roleId of [
    logisticUser.roleId,
    commercialUser.roleId,
    customer1.roleId,
    vendor1.roleId,
    intercoUser.roleId,
  ]) {
    await grant(roleId, 'prereg:read')
  }

  await prisma.userPlant.createMany({
    data: [
      {
        userId: logisticUser.id,
        plantId: plantAlphaId,
      },
      {
        userId: commercialUser.id,
        plantId: plantAlphaId,
      },
      {
        userId: customer1.id,
        plantId: plantAlphaId,
      },
      {
        userId: customer1.id,
        plantId: plantBetaId,
      },
      {
        userId: vendor1.id,
        plantId: plantAlphaId,
      },
      {
        userId: vendor1.id,
        plantId: plantBetaId,
      },
      {
        userId: vendor2.id,
        plantId: plantBetaId,
      },
    ],
  })

  await seedJulRow({
    customerId: customer1.id,
    plantId: plantAlphaId,
    sapPlantCode: '3711',
    number: 'JUL-RPT-0001',
    referenceDocument: '9100000001',
    stoNumber: '4509000001',
    submittedAt: new Date('2026-11-10T02:00:00.000Z'),
    loadingDate: new Date('2026-11-12T00:00:00.000Z'),
    driverLicenseNumber: '8891000000000001',
    driverName: 'Rep Driver One',
    vehiclePlateNumber: 'B 9101 REP',
    mediaTransport: 'T',
    quantity: '150.25',
    uom: 'KG',
    status: 'COMPLETED',
    loadingNoteNumber: 'LN-910001',
  })

  await seedJulRow({
    customerId: customer1.id,
    plantId: plantBetaId,
    sapPlantCode: '3712',
    number: 'JUL-RPT-0002',
    referenceDocument: '9100000002',
    stoNumber: null,
    submittedAt: new Date('2026-11-08T18:00:00.000Z'),
    loadingDate: new Date('2026-11-14T00:00:00.000Z'),
    driverLicenseNumber: '8891000000000002',
    driverName: 'Rep Driver Two',
    vehiclePlateNumber: 'B 9102 REP',
    mediaTransport: 'T',
    quantity: '80',
    uom: 'KG',
    status: 'SUBMITTED',
    loadingNoteNumber: null,
  })

  await seedJulRow({
    customerId: customer2.id,
    plantId: plantAlphaId,
    sapPlantCode: '3711',
    number: 'JUL-RPT-0003',
    referenceDocument: '9200000001',
    stoNumber: null,
    submittedAt: new Date('2026-11-10T03:00:00.000Z'),
    loadingDate: new Date('2026-11-15T00:00:00.000Z'),
    driverLicenseNumber: '8891000000000003',
    driverName: 'Rep Driver Three',
    vehiclePlateNumber: 'B 9201 REP',
    mediaTransport: 'T',
    quantity: '200',
    uom: 'KG',
    status: 'APPROVED',
    loadingNoteNumber: null,
  })

  await seedBelRow({
    vendorId: vendor1.id,
    vendorCode: vendor1.username,
    plantId: plantAlphaId,
    sapPlantCode: '3711',
    number: 'BEL-RPT-0001',
    poNumber: '4590000001',
    poItem: '00010',
    submittedAt: new Date('2026-11-10T04:00:00.000Z'),
    loadingDate: new Date('2026-11-16T00:00:00.000Z'),
    driverLicenseNumber: '8892000000000001',
    driverName: 'BEL Rep Driver',
    vehiclePlateNumber: 'B 9301 BEL',
    mediaTransport: 'V',
    quantity: '320.5',
    uom: 'KG',
    status: 'APPROVED',
  })

  await seedBelRow({
    vendorId: vendor1.id,
    vendorCode: vendor1.username,
    plantId: plantBetaId,
    sapPlantCode: '3712',
    number: 'BEL-RPT-0002',
    poNumber: '4590000002',
    poItem: '00020',
    submittedAt: new Date('2026-11-07T04:00:00.000Z'),
    loadingDate: new Date('2026-11-18T00:00:00.000Z'),
    driverLicenseNumber: '8892000000000002',
    driverName: 'BEL Beta Driver',
    vehiclePlateNumber: 'B 9302 BEL',
    mediaTransport: 'T',
    quantity: '45',
    uom: 'KG',
    status: 'REJECTED',
  })

  await seedBelRow({
    vendorId: vendor2.id,
    vendorCode: vendor2.username,
    plantId: plantAlphaId,
    sapPlantCode: '3711',
    number: 'BEL-RPT-0003',
    poNumber: '4590000003',
    poItem: '00010',
    submittedAt: new Date('2026-11-10T05:00:00.000Z'),
    loadingDate: null,
    driverLicenseNumber: '8892000000000003',
    driverName: 'BEL Vendor Two',
    vehiclePlateNumber: 'B 9401 BEL',
    mediaTransport: 'T',
    quantity: '90',
    uom: 'KG',
    status: 'DRAFT',
  })

  adminCookie = cookieFrom(await login(adminUser.username))
  logisticCookie = cookieFrom(await login(logisticUser.username))
  commercialCookie = cookieFrom(await login(commercialUser.username))
  commercialNoPlantCookie = cookieFrom(await login(commercialNoPlant.username))
  customer1Cookie = cookieFrom(await login(customer1.username))
  vendor1Cookie = cookieFrom(await login(vendor1.username))
  intercoCookie = cookieFrom(await login(intercoUser.username))
  noReadCookie = cookieFrom(await login(noReadUser.username))
})

afterAll(async () => {
  await prisma.julLine.deleteMany({
    where: {
      registrationId: {
        in: createdJulRegIds,
      },
    },
  })

  await prisma.julRegistration.deleteMany({
    where: {
      id: {
        in: createdJulRegIds,
      },
    },
  })

  await prisma.julDocument.deleteMany({
    where: {
      id: {
        in: createdJulDocIds,
      },
    },
  })

  await prisma.belLine.deleteMany({
    where: {
      registrationId: {
        in: createdBelRegIds,
      },
    },
  })

  await prisma.belRegistration.deleteMany({
    where: {
      id: {
        in: createdBelRegIds,
      },
    },
  })

  await prisma.belDocument.deleteMany({
    where: {
      id: {
        in: createdBelDocIds,
      },
    },
  })

  await prisma.userPlant.deleteMany({
    where: {
      userId: {
        in: createdUserIds,
      },
    },
  })

  await prisma.user.deleteMany({
    where: {
      id: {
        in: createdUserIds,
      },
    },
  })

  await prisma.role.deleteMany({
    where: {
      code: 'REPORT_NO_PERM',
    },
  })

  await prisma.plant.deleteMany({
    where: {
      id: {
        in: createdPlantIds,
      },
    },
  })
})

describe('registration report API (AWB-24)', () => {
  it('returns all required columns for JUL and BEL truck allocation rows', async () => {
    const response = await request(app)
      .get('/api/registration-reports')
      .query({
        search: 'RPT-',
        limit: 50,
      })
      .set('Cookie', adminCookie)

    expect(response.status).toBe(200)
    expect(response.body.data.total).toBe(5)

    expect(
      (response.body.data.items as { registrationNumber: string }[]).map(
        (row) => row.registrationNumber,
      ),
    ).not.toContain('BEL-RPT-0003')

    const draftFilter = await request(app)
      .get('/api/registration-reports')
      .query({ status: 'DRAFT' })
      .set('Cookie', adminCookie)

    expect(draftFilter.status).toBe(422)

    const items = response.body.data.items as {
      registrationNumber: string
      type: string
      documentNumber: string
      documentItem: string | null
      stoNumber: string | null
      partner: { id: string; code: string; name: string }
      plant: { id: string; code: string; sapPlantCode: string | null; name: string }
      loadingNoteNumber: string | null
      requestDate: string
      loadingDate: string | null
      driverLicenseNumber: string | null
      driverName: string | null
      vehiclePlateNumber: string | null
      mediaTransport: string
      plannedQuantity: string
      uom: string
      status: string
    }[]

    const jul = items.find((row) => row.registrationNumber === 'JUL-RPT-0001')!
    const bel = items.find((row) => row.registrationNumber === 'BEL-RPT-0001')!

    expect(jul).toMatchObject({
      registrationNumber: 'JUL-RPT-0001',
      type: 'JUL',
      documentNumber: '9100000001',
      documentItem: null,
      stoNumber: '4509000001',
      partner: {
        id: customer1.id,
        code: customer1.username,
      },
      plant: {
        id: plantAlphaId,
        sapPlantCode: '3711',
      },
      loadingNoteNumber: 'LN-910001',
      requestDate: '2026-11-10',
      loadingDate: '2026-11-12',
      driverLicenseNumber: '8891000000000001',
      driverName: 'Rep Driver One',
      vehiclePlateNumber: 'B 9101 REP',
      mediaTransport: 'T',
      plannedQuantity: '150.25',
      uom: 'KG',
      status: 'COMPLETED',
    })

    expect(bel).toMatchObject({
      registrationNumber: 'BEL-RPT-0001',
      type: 'BEL',
      documentNumber: '4590000001',
      documentItem: '00010',
      stoNumber: null,
      partner: {
        id: vendor1.id,
        code: vendor1.username,
      },
      plant: {
        id: plantAlphaId,
        sapPlantCode: '3711',
      },
      loadingNoteNumber: null,
      requestDate: '2026-11-10',
      loadingDate: '2026-11-16',
      driverLicenseNumber: '8892000000000001',
      driverName: 'BEL Rep Driver',
      vehiclePlateNumber: 'B 9301 BEL',
      mediaTransport: 'V',
      plannedQuantity: '320.5',
      uom: 'KG',
      status: 'APPROVED',
    })
  })

  it('enforces RBAC at query level for customer, vendor, admin, logistic, and commercial', async () => {
    const noPerm = await request(app).get('/api/registration-reports').set('Cookie', noReadCookie)

    expect(noPerm.status).toBe(403)

    const unsupported = await request(app)
      .get('/api/registration-reports')
      .set('Cookie', intercoCookie)

    expect(unsupported.status).toBe(403)

    const customerList = await request(app)
      .get('/api/registration-reports')
      .set('Cookie', customer1Cookie)

    expect(customerList.status).toBe(200)

    expect(
      (customerList.body.data.items as { registrationNumber: string; type: string }[]).map(
        (row) => row.registrationNumber,
      ),
    ).toEqual(['JUL-RPT-0001', 'JUL-RPT-0002'])

    const customerBelAttempt = await request(app)
      .get('/api/registration-reports')
      .query({ type: 'BEL' })
      .set('Cookie', customer1Cookie)

    expect(customerBelAttempt.status).toBe(200)
    expect(customerBelAttempt.body.data.items).toEqual([])

    const customerPartnerFilter = await request(app)
      .get('/api/registration-reports')
      .query({ partnerId: customer2.id })
      .set('Cookie', customer1Cookie)

    expect(customerPartnerFilter.status).toBe(403)

    const vendorList = await request(app)
      .get('/api/registration-reports')
      .set('Cookie', vendor1Cookie)

    expect(vendorList.status).toBe(200)

    expect(
      (vendorList.body.data.items as { registrationNumber: string }[]).map(
        (row) => row.registrationNumber,
      ),
    ).toEqual(['BEL-RPT-0001', 'BEL-RPT-0002'])

    const vendorJulAttempt = await request(app)
      .get('/api/registration-reports')
      .query({ type: 'JUL' })
      .set('Cookie', vendor1Cookie)

    expect(vendorJulAttempt.status).toBe(200)
    expect(vendorJulAttempt.body.data.items).toEqual([])

    const vendorPartnerFilter = await request(app)
      .get('/api/registration-reports')
      .query({ partnerId: vendor2.id })
      .set('Cookie', vendor1Cookie)

    expect(vendorPartnerFilter.status).toBe(403)

    for (const cookie of [logisticCookie, commercialCookie]) {
      const internalList = await request(app)
        .get('/api/registration-reports')
        .query({ search: 'RPT-' })
        .set('Cookie', cookie)

      expect(internalList.status).toBe(200)

      expect(
        (internalList.body.data.items as { registrationNumber: string }[])
          .map((row) => row.registrationNumber)
          .sort(),
      ).toEqual(['BEL-RPT-0001', 'JUL-RPT-0001', 'JUL-RPT-0003'])

      const unassignedPlant = await request(app)
        .get('/api/registration-reports')
        .query({ plantId: plantBetaId })
        .set('Cookie', cookie)

      expect(unassignedPlant.status).toBe(200)
      expect(unassignedPlant.body.data.items).toEqual([])
    }

    const zeroPlant = await request(app)
      .get('/api/registration-reports')
      .set('Cookie', commercialNoPlantCookie)

    expect(zeroPlant.status).toBe(200)
    expect(zeroPlant.body.data.total).toBe(0)
  })

  it('filters by dates, type, status, plant, partner, search, sorting, and server paging (default 20)', async () => {
    const jakartaDate = await request(app)
      .get('/api/registration-reports')
      .query({
        search: 'RPT-',
        dateField: 'request',
        dateFrom: '2026-11-09',
        dateTo: '2026-11-09',
      })
      .set('Cookie', adminCookie)

    expect(jakartaDate.status).toBe(200)

    expect(
      (jakartaDate.body.data.items as { registrationNumber: string }[]).map(
        (row) => row.registrationNumber,
      ),
    ).toEqual(['JUL-RPT-0002'])

    const loadingRange = await request(app)
      .get('/api/registration-reports')
      .query({
        search: 'RPT-',
        dateField: 'loading',
        dateFrom: '2026-11-15',
        dateTo: '2026-11-18',
      })
      .set('Cookie', adminCookie)

    expect(loadingRange.status).toBe(200)

    expect(
      (loadingRange.body.data.items as { registrationNumber: string }[])
        .map((row) => row.registrationNumber)
        .sort(),
    ).toEqual(['BEL-RPT-0001', 'BEL-RPT-0002', 'JUL-RPT-0003'])

    const statusAndPartner = await request(app)
      .get('/api/registration-reports')
      .query({
        search: 'RPT-',
        type: 'BEL',
        status: 'APPROVED,REJECTED',
        partnerId: vendor1.id,
        plantId: plantAlphaId,
      })
      .set('Cookie', adminCookie)

    expect(statusAndPartner.status).toBe(200)

    expect(
      (statusAndPartner.body.data.items as { registrationNumber: string }[]).map(
        (row) => row.registrationNumber,
      ),
    ).toEqual(['BEL-RPT-0001'])

    for (const term of ['9100000001', 'LN-910001']) {
      const hit = await request(app)
        .get('/api/registration-reports')
        .query({ search: term })
        .set('Cookie', adminCookie)

      expect(
        hit.body.data.items.map((r: { registrationNumber: string }) => r.registrationNumber),
      ).toEqual(['JUL-RPT-0001'])
    }

    for (const term of ['4590000001/00010', 'B 9301 BEL', '8892000000000001']) {
      const hit = await request(app)
        .get('/api/registration-reports')
        .query({ search: term })
        .set('Cookie', adminCookie)

      expect(
        hit.body.data.items.map((r: { registrationNumber: string }) => r.registrationNumber),
      ).toEqual(['BEL-RPT-0001'])
    }

    const literalWildcard = await request(app)
      .get('/api/registration-reports')
      .query({ search: '%' })
      .set('Cookie', adminCookie)

    expect(literalWildcard.body.data.total).toBe(0)

    const defaultPage = await request(app)
      .get('/api/registration-reports')
      .query({ search: 'RPT-' })
      .set('Cookie', adminCookie)

    expect(defaultPage.body.data.limit).toBe(20)

    const sortedPage1 = await request(app)
      .get('/api/registration-reports')
      .query({
        search: 'RPT-',
        sortBy: 'plannedQuantity',
        sortDirection: 'asc',
        page: 1,
        limit: 2,
      })
      .set('Cookie', adminCookie)

    const sortedPage2 = await request(app)
      .get('/api/registration-reports')
      .query({
        search: 'RPT-',
        sortBy: 'plannedQuantity',
        sortDirection: 'asc',
        page: 2,
        limit: 2,
      })
      .set('Cookie', adminCookie)

    expect(
      (sortedPage1.body.data.items as { plannedQuantity: string }[]).map((r) => r.plannedQuantity),
    ).toEqual(['45', '80'])

    expect(
      (sortedPage2.body.data.items as { plannedQuantity: string }[]).map((r) => r.plannedQuantity),
    ).toEqual(['150.25', '200'])
  })

  it('exports Excel (.xlsx) honoring the exact same RBAC and filter rules', async () => {
    const exported = await request(app)
      .get('/api/registration-reports/export')
      .query({
        search: 'RPT-',
        sortBy: 'plannedQuantity',
        sortDirection: 'desc',
      })
      .set('Cookie', logisticCookie)
      .buffer(true)
      .parse(parseBinary)

    expect(exported.status).toBe(200)
    expect(exported.headers['content-type']).toMatch(/spreadsheetml\.sheet/)

    const workbook = new ExcelJS.Workbook()

    await workbook.xlsx.load(exported.body as unknown as ExcelJS.Buffer)
    const sheet = workbook.getWorksheet('Registration Report')!

    expect(sheet).toBeDefined()
    expect(sheet.rowCount).toBe(4)

    const headerValues = sheet.getRow(1).values as string[]

    expect(headerValues).toContain('No. Registrasi')
    expect(headerValues).toContain('No. Loading Note')
    expect(headerValues).toContain('Kuantitas Rencana')

    expect(sheet.getRow(2).getCell(1).value).toBe('BEL-RPT-0001')
    expect(sheet.getRow(2).getCell(2).value).toBe('BEL')
    expect(sheet.getRow(2).getCell(9).value).toBe('')
    expect(sheet.getRow(2).getCell(16).value).toBe(320.5)

    expect(sheet.getRow(4).getCell(1).value).toBe('JUL-RPT-0001')
    expect(sheet.getRow(4).getCell(9).value).toBe('LN-910001')
    expect(sheet.getRow(4).getCell(16).value).toBe(150.25)

    const customerOptions = await request(app)
      .get('/api/registration-reports/options')
      .set('Cookie', customer1Cookie)

    expect(customerOptions.status).toBe(200)
    expect(customerOptions.body.data.partners).toEqual([])

    const customerBlockedExport = await request(app)
      .get('/api/registration-reports/export')
      .query({ partnerId: customer2.id })
      .set('Cookie', customer1Cookie)

    expect(customerBlockedExport.status).toBe(403)
  })
})
