import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'

describe('AWB-9: Role Permissions & Access Control API', () => {
  let adminRole: any
  let logisticRole: any
  let kraniRole: any
  let testPerm1: any
  let testPerm2: any

  beforeAll(async () => {
    // 1. Seed Roles
    adminRole = await prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: { code: 'ADMIN', name: 'Admin HO' },
    })
    logisticRole = await prisma.role.upsert({
      where: { code: 'LOGISTIC' },
      update: {},
      create: { code: 'LOGISTIC', name: 'Logistic Staff' },
    })
    kraniRole = await prisma.role.upsert({
      where: { code: 'KRANIWB' },
      update: {},
      create: { code: 'KRANIWB', name: 'Krani Weighbridge' },
    })

    // 2. Seed Permissions
    testPerm1 = await prisma.permission.upsert({
      where: { code: 'reports:view' },
      update: {},
      create: { code: 'reports:view', name: 'View Reports', module: 'reports' },
    })
    testPerm2 = await prisma.permission.upsert({
      where: { code: 'prereg:create' },
      update: {},
      create: { code: 'prereg:create', name: 'Create Pre-Registration', module: 'prereg' },
    })
  })

  it('lists all available permissions', async () => {
    const res = await request(app).get('/api/access/permissions')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    const codes = res.body.data.map((p: any) => p.code)
    expect(codes).toContain('reports:view')
    expect(codes).toContain('prereg:create')
  })

  it('protects role matrix endpoints from non-ADMIN users', async () => {
    // Attempt list roles without ADMIN
    const listRes = await request(app)
      .get('/api/access/roles')
      .set('x-user-role', 'LOGISTIC')
    expect(listRes.status).toBe(403)
    expect(listRes.body.error).toMatch(/ADMIN role required/i)

    // Attempt update permissions without ADMIN
    const updateRes = await request(app)
      .put(`/api/access/roles/${logisticRole.id}/permissions`)
      .set('x-user-role', 'KRANIWB')
      .send({ permissionCodes: ['reports:view'] })
    expect(updateRes.status).toBe(403)
  })

  it('allows ADMIN to view role matrix and configure role permissions (Checklist 3)', async () => {
    // 1. ADMIN fetches role matrix
    const matrixRes = await request(app)
      .get('/api/access/roles')
      .set('x-user-role', 'ADMIN')
    expect(matrixRes.status).toBe(200)
    expect(matrixRes.body.success).toBe(true)
    expect(Array.isArray(matrixRes.body.data)).toBe(true)

    // 2. ADMIN assigns 'reports:view' to LOGISTIC
    const assignRes = await request(app)
      .put(`/api/access/roles/${logisticRole.id}/permissions`)
      .set('x-user-role', 'ADMIN')
      .send({
        permissionCodes: ['reports:view'],
      })
    expect(assignRes.status).toBe(200)
    expect(assignRes.body.success).toBe(true)
    expect(assignRes.body.data.permissionCodes).toContain('reports:view')
    expect(assignRes.body.data.permissionCodes).not.toContain('prereg:create')

    // 3. ADMIN updates again to grant both permissions
    const updateBothRes = await request(app)
      .put(`/api/access/roles/${logisticRole.id}/permissions`)
      .set('x-user-role', 'ADMIN')
      .send({
        permissionCodes: ['reports:view', 'prereg:create'],
      })
    expect(updateBothRes.status).toBe(200)
    expect(updateBothRes.body.data.permissionCodes).toContain('reports:view')
    expect(updateBothRes.body.data.permissionCodes).toContain('prereg:create')

    // 4. Revoke 'reports:view' from LOGISTIC
    const revokeRes = await request(app)
      .put(`/api/access/roles/${logisticRole.id}/permissions`)
      .set('x-user-role', 'ADMIN')
      .send({
        permissionCodes: ['prereg:create'],
      })
    expect(revokeRes.status).toBe(200)
    expect(revokeRes.body.data.permissionCodes).not.toContain('reports:view')
    expect(revokeRes.body.data.permissionCodes).toContain('prereg:create')
  })

  it('rejects unauthorized API access when role lacks required permission (Checklist 2)', async () => {
    // Ensure KRANIWB has no 'reports:view' permission
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: kraniRole.id,
        permissionId: testPerm1.id,
      },
    })

    // 1. KRANIWB tries to access protected reports endpoint -> MUST BE REJECTED 403
    const blockedRes = await request(app)
      .get('/api/access/protected/reports')
      .set('x-user-role', 'KRANIWB')
    expect(blockedRes.status).toBe(403)
    expect(blockedRes.body.error).toMatch(/lacks required permission 'reports:view'/i)

    // 2. Request without role header -> REJECTED 401
    const unauthRes = await request(app).get('/api/access/protected/reports')
    expect(unauthRes.status).toBe(401)

    // 3. ADMIN always has access
    const adminRes = await request(app)
      .get('/api/access/protected/reports')
      .set('x-user-role', 'ADMIN')
    expect(adminRes.status).toBe(200)
    expect(adminRes.body.data.message).toBe('Welcome to operational reports data')

    // 4. Now grant 'reports:view' to KRANIWB via API
    await request(app)
      .put(`/api/access/roles/${kraniRole.id}/permissions`)
      .set('x-user-role', 'ADMIN')
      .send({ permissionCodes: ['reports:view'] })

    // 5. KRANIWB accesses reports endpoint again -> NOW SUCCEEDS 200
    const allowedRes = await request(app)
      .get('/api/access/protected/reports')
      .set('x-user-role', 'KRANIWB')
    expect(allowedRes.status).toBe(200)
    expect(allowedRes.body.data.message).toBe('Welcome to operational reports data')
  })
})
