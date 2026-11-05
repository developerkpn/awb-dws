import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { sessionFor, grant, origin } from './helpers'

describe('Permission enforcement', () => {
  it('changes real endpoint access for already logged-in users', async () => {
    const admin = await sessionFor()
    const staff = await sessionFor('LOGISTIC')
    await grant(staff.user.roleId, 'prereg:read')
    const endpoint = `/api/pre-registrations/${randomUUID()}`

    expect((await request(app).get(endpoint).set('Cookie', staff.cookie)).status).toBe(404)

    const revoke = await request(app)
      .put(`/api/access/roles/${staff.user.roleId}/permissions`)
      .set('Origin', origin)
      .set('Cookie', admin.cookie)
      .send({ permissionCodes: [] })
    expect(revoke.status).toBe(200)
    expect((await request(app).get(endpoint).set('Cookie', staff.cookie)).status).toBe(403)

    const restore = await request(app)
      .put(`/api/access/roles/${staff.user.roleId}/permissions`)
      .set('Origin', origin)
      .set('Cookie', admin.cookie)
      .send({ permissionCodes: ['prereg:read'] })
    expect(restore.status).toBe(200)
    expect(
      (await request(app).get('/api/auth/me').set('Cookie', staff.cookie)).body.data.user
        .permissions,
    ).toContain('prereg:read')
    expect((await request(app).get(endpoint).set('Cookie', staff.cookie)).status).toBe(404)

    const saved = await request(app)
      .get(`/api/access/roles/${staff.user.roleId}/permissions`)
      .set('Cookie', admin.cookie)
    expect(saved.body.data.permissionCodes).toEqual(['prereg:read'])
  })

  it('rejects unknown/duplicate codes, non-admin changes and attempts to restrict ADMIN', async () => {
    const admin = await sessionFor()
    const staff = await sessionFor('LOGISTIC')
    const endpoint = `/api/access/roles/${staff.user.roleId}/permissions`

    expect(
      (
        await request(app)
          .put(endpoint)
          .set('Origin', origin)
          .set('Cookie', staff.cookie)
          .set('x-user-role', 'ADMIN')
          .send({ permissionCodes: [] })
      ).status,
    ).toBe(403)
    expect(
      (
        await request(app)
          .put(endpoint)
          .set('Origin', origin)
          .set('Cookie', admin.cookie)
          .send({ permissionCodes: ['unknown'] })
      ).status,
    ).toBe(422)
    expect(
      (
        await request(app)
          .put(endpoint)
          .set('Origin', origin)
          .set('Cookie', admin.cookie)
          .send({ permissionCodes: ['prereg:read', 'prereg:read'] })
      ).status,
    ).toBe(422)
    expect(
      (
        await request(app)
          .put(`/api/access/roles/${admin.user.roleId}/permissions`)
          .set('Origin', origin)
          .set('Cookie', admin.cookie)
          .send({ permissionCodes: [] })
      ).status,
    ).toBe(409)
    expect(
      await prisma.accountAudit.count({ where: { action: 'role.permissions_updated' } }),
    ).toBeGreaterThan(0)
  })
})
