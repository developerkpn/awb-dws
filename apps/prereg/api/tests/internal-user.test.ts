import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { emailOutbox } from '../src/services/mailer'

describe('AWB-7: Internal Users and Roles API', () => {
  beforeAll(async () => {
    const roles = [
      { code: 'ADMIN', name: 'Admin' },
      { code: 'MANAGER', name: 'Manager' },
      { code: 'LOGISTIC', name: 'Logistic' },
      { code: 'COMMERCIAL', name: 'Commercial' },
      { code: 'KRANIWB', name: 'Krani WB' },
    ]
    for (const r of roles) {
      await prisma.role.upsert({
        where: { code: r.code },
        update: {},
        create: r,
      })
    }
  })
  it('protects internal user management endpoints from non-ADMIN users', async () => {
    // Attempting to create user without ADMIN header
    const res = await request(app)
      .post('/api/internal-users')
      .send({
        name: 'Intruder',
        username: 'intruder',
        email: 'intruder@test.com',
        role: 'LOGISTIC',
      })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/ADMIN role required/i)
  })

  it('allows ADMIN to create an internal user with system-generated password and email delivery', async () => {
    const timestamp = Date.now()
    const testUsername = `user_${timestamp}`
    const testEmail = `user_${timestamp}@kpncorp.com`

    // Seed a plant to test plant access
    const plant = await prisma.plant.upsert({
      where: { code: 'PRISCOLIN_KARAWANG' },
      update: {},
      create: { code: 'PRISCOLIN_KARAWANG', name: 'Priscolin Karawang', city: 'Karawang' },
    })

    const initialEmailCount = emailOutbox.length

    // ADMIN creates account
    const createRes = await request(app)
      .post('/api/internal-users')
      .set('x-user-role', 'ADMIN')
      .send({
        name: 'Siti Rahma Test',
        username: testUsername,
        email: testEmail,
        phone: '+62812345678',
        role: 'LOGISTIC',
        plantIds: [plant.id],
      })

    expect(createRes.status).toBe(201)
    expect(createRes.body.success).toBe(true)
    const { user, temporaryPassword } = createRes.body.data

    expect(user.id).toBeDefined()
    expect(user.username).toBe(testUsername)
    expect(user.role).toBe('LOGISTIC')
    expect(user.isActive).toBe(true)
    expect(user.plantAccess).toHaveLength(1)
    expect(user.plantAccess[0].code).toBe('PRISCOLIN_KARAWANG')

    // Password was created by system (not client) and returned
    expect(temporaryPassword).toBeDefined()
    expect(temporaryPassword.length).toBeGreaterThanOrEqual(10)

    // Password was dispatched to email
    expect(emailOutbox.length).toBe(initialEmailCount + 1)
    const sentEmail = emailOutbox[emailOutbox.length - 1]!
    expect(sentEmail.to).toBe(testEmail)
    expect(sentEmail.content).toContain(temporaryPassword)

    // Verify user can log in with system-generated password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUsername,
        password: temporaryPassword,
      })
    expect(loginRes.status).toBe(200)
    expect(loginRes.body.success).toBe(true)
    expect(loginRes.body.data.user.username).toBe(testUsername)

    // ADMIN updates user details
    const updateRes = await request(app)
      .put(`/api/internal-users/${user.id}`)
      .set('x-user-role', 'ADMIN')
      .send({
        name: 'Siti Rahma Senior Logistic',
        role: 'COMMERCIAL',
      })
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.name).toBe('Siti Rahma Senior Logistic')
    expect(updateRes.body.data.role).toBe('COMMERCIAL')

    // ADMIN deactivates user (Checklist: Akun nonaktif tidak bisa login)
    const deactivateRes = await request(app)
      .patch(`/api/internal-users/${user.id}/status`)
      .set('x-user-role', 'ADMIN')
      .send({ isActive: false })
    expect(deactivateRes.status).toBe(200)
    expect(deactivateRes.body.data.isActive).toBe(false)

    // Deactivated user tries to log in -> MUST FAIL
    const blockedLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUsername,
        password: temporaryPassword,
      })
    expect(blockedLoginRes.status).toBe(403)
    expect(blockedLoginRes.body.error).toMatch(/inactive/i)

    // Re-activate user
    await request(app)
      .patch(`/api/internal-users/${user.id}/status`)
      .set('x-user-role', 'ADMIN')
      .send({ isActive: true })

    // ADMIN resets password
    const resetRes = await request(app)
      .post(`/api/internal-users/${user.id}/reset-password`)
      .set('x-user-role', 'ADMIN')
    expect(resetRes.status).toBe(200)
    const { temporaryPassword: newPassword } = resetRes.body.data
    expect(newPassword).toBeDefined()
    expect(newPassword).not.toBe(temporaryPassword)

    // Old password should now fail
    const oldLoginFail = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUsername,
        password: temporaryPassword,
      })
    expect(oldLoginFail.status).toBe(401)

    // New password should succeed
    const newLoginSuccess = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUsername,
        password: newPassword,
      })
    expect(newLoginSuccess.status).toBe(200)
    expect(newLoginSuccess.body.success).toBe(true)
  })

  it('rejects duplicate username or email', async () => {
    const timestamp = Date.now()
    const username = `dup_${timestamp}`
    const email = `dup_${timestamp}@kpncorp.com`

    await request(app)
      .post('/api/internal-users')
      .set('x-user-role', 'ADMIN')
      .send({
        name: 'User 1',
        username,
        email,
        role: 'KRANIWB',
      })

    const duplicateRes = await request(app)
      .post('/api/internal-users')
      .set('x-user-role', 'ADMIN')
      .send({
        name: 'User 2',
        username,
        email: `other_${timestamp}@kpncorp.com`,
        role: 'KRANIWB',
      })
    expect(duplicateRes.status).toBe(409)
  })
})
