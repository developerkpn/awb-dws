import { describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'

describe('AWB-2 Schema & Database Models', () => {
  it('creates and retrieves roles and permissions', async () => {
    const roleCode = `TEST_ROLE_${Date.now()}`

    const role = await prisma.role.create({
      data: {
        code: roleCode,
        name: 'Test Role',
        description: 'Role for test suite',
      },
    })

    expect(role.id).toBeDefined()
    expect(role.code).toBe(roleCode)

    const permCode = `test:perm_${Date.now()}`

    const perm = await prisma.permission.create({
      data: {
        code: permCode,
        name: 'Test Permission',
        module: 'test',
      },
    })

    expect(perm.id).toBeDefined()

    const rolePerm = await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: perm.id,
      },
    })

    expect(rolePerm.id).toBeDefined()
  })

  it('stores staff and SAP partner logins in the same user table', async () => {
    const role = await prisma.role.upsert({
      where: { code: 'CUSTOMER' },
      update: {},
      create: {
        code: 'CUSTOMER',
        name: 'Customer',
      },
    })

    const account = await prisma.user.create({
      data: {
        name: 'Partner account',
        username: `SAP-${Date.now()}`,
        passwordHash: 'unused-test-hash',
        accountType: 'PARTNER',
        roleId: role.id,
        city: 'Jakarta',
        country: 'ID',
      },
    })

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: account.id },
    })

    expect(stored).toMatchObject({
      accountType: 'PARTNER',
      username: account.username,
      city: 'Jakarta',
      country: 'ID',
    })
  })

  it('supports restricting internal staff by plant', async () => {
    const role = await prisma.role.upsert({
      where: { code: 'LOGISTIC' },
      update: {},
      create: {
        code: 'LOGISTIC',
        name: 'Logistic',
      },
    })

    const plant = await prisma.plant.create({
      data: {
        code: `PLANT_${Date.now()}`,
        name: 'Test Plant Location',
        city: 'Karawang',
      },
    })

    const internalUser = await prisma.user.create({
      data: {
        name: 'Test Staff',
        username: `staff_${Date.now()}`,
        passwordHash: 'dummy_hash',
        accountType: 'INTERNAL',
        roleId: role.id,
      },
    })

    await prisma.userPlant.create({
      data: {
        userId: internalUser.id,
        plantId: plant.id,
      },
    })

    const staffWithPlants = await prisma.user.findUnique({
      where: { id: internalUser.id },
      include: {
        plants: {
          include: { plant: true },
        },
      },
    })

    expect(staffWithPlants?.plants).toHaveLength(1)
    expect(staffWithPlants?.plants[0]?.plant.code).toBe(plant.code)
  })

  it('creates OTP for forgot password with expiration', async () => {
    const email = `test_otp_${Date.now()}@example.com`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const otp = await prisma.userOtp.create({
      data: {
        email,
        otpCode: '849201',
        purpose: 'FORGOT_PASSWORD',
        expiresAt,
        isUsed: false,
      },
    })

    expect(otp.id).toBeDefined()
    expect(otp.isUsed).toBe(false)
    expect(otp.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })
})
