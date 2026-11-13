import request from 'supertest'
import app from '../src/app'
import { env } from '../src/config/env'
import { prisma } from '../src/config/prisma'
import { hashPassword } from '../src/lib/password'
import masterService from '../src/modules/master/master.service'

export const ORIGIN = new URL(env.APP_ORIGIN).origin
export const PASSWORD = 'Test-Password-123'
export const DRIVER_PHOTO =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAACAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCeiiivkD6o/9k='

export async function createOperator(
  username: string,
  overrides: { isActive?: boolean; role?: 'ADMIN' | 'OPERATOR' } = {},
) {
  return prisma.user.create({
    data: {
      username,
      name: `Operator ${username}`,
      role: overrides.role ?? 'OPERATOR',
      passwordHash: await hashPassword(PASSWORD),
      isActive: overrides.isActive ?? true,
    },
  })
}

export async function signIn(username: string) {
  const agent = request.agent(app)

  const res = await agent.post('/api/auth/login').set('Origin', ORIGIN).send({
    username,
    password: PASSWORD,
  })

  if (res.status !== 200) throw new Error(`Login failed for ${username}: ${res.status}`)

  return agent
}

export async function resetOperators(prefix: string) {
  await prisma.registration.deleteMany({
    where: {
      createdBy: {
        username: { startsWith: prefix },
      },
    },
  })

  await prisma.authSession.deleteMany({
    where: {
      user: {
        username: { startsWith: prefix },
      },
    },
  })

  await prisma.user.deleteMany({
    where: {
      username: { startsWith: prefix },
    },
  })
}

/** SAP master rows the registration tests refer to, written through the backfill path. */
export async function seedSapMasters() {
  const at = new Date()

  await masterService.backfill(
    'vehicle',
    ['B 9005 SDC', 'KB 1234 XY', 'DA 5555 ZZ'].map((plateNumber) => ({
      plateNumber,
      transporterCode: 'BMS',
      transporterName: 'Bina Mitra Sejahtera',
    })),
    at,
  )

  await masterService.backfill(
    'driver',
    [
      {
        licenseNumber: '000815290110',
        name: 'AGIL HASAN',
      },
    ],
    at,
  )

  await masterService.backfill(
    'transporter',
    [
      {
        code: 'BMS',
        name: 'Bina Mitra Sejahtera',
      },
    ],
    at,
  )

  await masterService.backfill(
    'destination',
    [
      {
        code: 'REF',
        name: 'REFINERY',
      },
      { code: 'KCP' },
    ],
    at,
  )

  await masterService.backfill(
    'transactionType',
    [
      {
        code: 'BEL',
        name: 'PEMBELIAN',
      },
      {
        code: 'JUL',
        name: 'PENJUALAN',
      },
    ],
    at,
  )

  await masterService.backfill(
    'commodity',
    [
      {
        code: '8010-10.11102',
        name: 'CRUDE PALM OIL FFA 3.5-5',
      },
      {
        code: '8010-50.40002',
        name: 'FATTY ACID METHYL ESTER (PME)',
      },
    ],
    at,
  )

  await masterService.backfill(
    'relation',
    [
      {
        code: 'AT11002698',
        name: 'PT. SAWIT MAKMUR SEJAHTERA',
        type: 'S',
      },
    ],
    at,
  )

  await masterService.backfill(
    'estate',
    [
      {
        code: 'EUK',
        name: 'PLANT EUP KIJING',
      },
    ],
    at,
  )

  await masterService.backfill(
    'contract',
    [
      {
        doNumber: 'SK01II02-00139',
        contractNumber: 'SK01II02-00139',
        transactionCode: 'BEL',
        commodityCode: '8010-10.11102',
        relationCode: 'AT11002698',
        transporterCode: 'BMS',
        estateCode: 'EUK',
        piNumber: 'PI-7',
        quantityKg: '250000',
        qualities: [
          {
            sapCode: 'FFA',
            value: '5.000',
          },
        ],
      },
      {
        doNumber: 'DO-2',
        transactionCode: 'JUL',
      },
      {
        doNumber: 'DO-3',
        transactionCode: 'JUL',
      },
      {
        doNumber: 'DO-4',
        transactionCode: 'BEL',
        commodityCode: '8010-10.11102',
      },
      {
        doNumber: 'DO-FAME',
        transactionCode: 'BEL',
        commodityCode: '8010-50.40002',
      },
      {
        doNumber: 'DO-RVS',
        transactionCode: 'RVS',
      },
      {
        doNumber: 'DO-CLOSED',
        transactionCode: 'BEL',
        isClosed: true,
      },
    ],
    at,
  )
}
