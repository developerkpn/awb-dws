import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeAll } from 'vitest'
import { prisma } from '../src/config/prisma'
import { env } from '../src/config/env'
import { hashPassword } from '../src/lib/password'
import app from '../src/app'

export const origin = env.APP_ORIGIN
export const password = 'Test-Password-123!'

beforeAll(async () => {
  await prisma.authRateLimit.deleteMany()
})

export async function createTestUser(code = 'ADMIN') {
  const role = await prisma.role.upsert({
    where: { code },
    create: {
      code,
      name: code,
    },
    update: { isActive: true },
  })

  const user = await prisma.user.create({
    data: {
      name: 'Test account',
      username: `test_${randomUUID()}`,
      passwordHash: await hashPassword(password),
      roleId: role.id,
      accountType: ['CUSTOMER', 'VENDOR', 'INTERCO'].includes(code) ? 'PARTNER' : 'INTERNAL',
    },
  })

  return {
    ...user,
    role,
  }
}

export async function login(username: string, inputPassword = password) {
  return request(app).post('/api/auth/login').set('Origin', origin).send({
    username,
    password: inputPassword,
  })
}

export function cookieFrom(response: { headers: Record<string, unknown> }) {
  const raw = response.headers['set-cookie']
  const value = Array.isArray(raw) ? raw[0] : raw

  if (typeof value !== 'string') throw new Error('Session cookie missing')

  return value.split(';')[0]!
}

export async function sessionFor(code = 'ADMIN') {
  const user = await createTestUser(code)
  const response = await login(user.username)

  return {
    user,
    cookie: cookieFrom(response),
  }
}

export async function grant(roleId: string, code: string) {
  const permission = await prisma.permission.upsert({
    where: { code },
    create: {
      code,
      name: code,
      module: code.split(':')[0]!,
    },
    update: {},
  })

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId: permission.id,
      },
    },
    create: {
      roleId,
      permissionId: permission.id,
    },
    update: {},
  })

  return permission
}

export async function plantFor(userId: string, code = 'TEST_REQUEST_PLANT') {
  const plant = await prisma.plant.upsert({
    where: { code },
    create: {
      code,
      name: 'Test request plant',
    },
    update: { isActive: true },
  })

  await prisma.userPlant.upsert({
    where: {
      userId_plantId: {
        userId,
        plantId: plant.id,
      },
    },
    create: {
      userId,
      plantId: plant.id,
    },
    update: {},
  })

  return plant.code
}

export async function documentFor(userId: string, category: 'sim' | 'driver' | 'stnk') {
  const document = await prisma.document.create({
    data: {
      fileKey: randomUUID(),
      fileName: category + '.png',
      mimeType: 'image/png',
      fileSize: 1,
      category,
      uploadedBy: userId,
    },
  })

  return '/api/documents/' + document.id
}

export async function driverBody(userId: string, siteId: string, licenseNumber: string) {
  return {
    kind: 'DRIVER' as const,
    siteId,
    driverLicenseNumber: licenseNumber,
    driverName: 'Fixture driver',
    driverBirthPlace: 'Karawang',
    driverBirthDate: '1990-01-01',
    driverPhone: '0800000000',
    driverCity: 'Karawang',
    driverAddress: 'Jl. Fixture 1',
    driverLicensePhotoUrl: await documentFor(userId, 'sim'),
    driverPhotoUrl: await documentFor(userId, 'driver'),
  }
}

export async function vehicleBody(userId: string, siteId: string, plateNumber: string) {
  return {
    kind: 'VEHICLE' as const,
    siteId,
    vehiclePlateNumber: plateNumber,
    vehicleStnkPhotoUrl: await documentFor(userId, 'stnk'),
  }
}
