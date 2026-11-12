import request from 'supertest'
import app from '../src/app'
import { env } from '../src/config/env'
import { prisma } from '../src/config/prisma'
import { hashPassword } from '../src/lib/password'
import masterService from '../src/modules/master/master.service'

export const ORIGIN = new URL(env.APP_ORIGIN).origin
export const PASSWORD = 'Test-Password-123'

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
        doNumber: 'DO-CLOSED',
        transactionCode: 'BEL',
        isClosed: true,
      },
    ],
    at,
  )
}
