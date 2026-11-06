import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { createTestUser, sessionFor } from './helpers'

describe('Server pagination', () => {
  it('returns bounded plant previews in account lists and full access only in details', async () => {
    const admin = await sessionFor()
    const customer = await createTestUser('CUSTOMER')
    const code = `ACCESS-${randomUUID()}`
    await prisma.plant.createMany({
      data: Array.from({ length: 25 }, (_, index) => ({
        code: `${code}-${index}`,
        name: `Access plant ${index}`,
      })),
    })
    const plants = await prisma.plant.findMany({ where: { code: { startsWith: code } } })
    await prisma.userPlant.createMany({
      data: plants.map((plant) => ({ userId: customer.id, plantId: plant.id })),
    })
    const response = await request(app)
      .get('/api/users')
      .query({ q: customer.username })
      .set('Cookie', admin.cookie)
    expect(response.status).toBe(200)
    const item = response.body.data.items[0]
    expect(item.plantCount).toBe(25)
    expect(item.plantPreview).toHaveLength(2)
    expect(item.roleName).toBeTruthy()
    for (const privateOrFull of ['passwordHash', 'plantAccess', 'partners'])
      expect(item).not.toHaveProperty(privateOrFull)
    const detail = await request(app).get(`/api/users/${customer.id}`).set('Cookie', admin.cookie)
    expect(detail.body.data.plantAccess).toHaveLength(25)
  })
  it('defaults all three lists to 20 and applies role search before count and pagination', async () => {
    const admin = await sessionFor()
    for (const endpoint of ['/api/users', '/api/access/roles', '/api/access/permissions']) {
      const response = await request(app).get(endpoint).set('Cookie', admin.cookie)
      expect(response.status).toBe(200)
      expect(response.body.data).toMatchObject({ page: 1, limit: 20 })
      expect(response.body.data.items.length).toBeLessThanOrEqual(20)
      expect(typeof response.body.data.total).toBe('number')
    }
    const code = `PAGE-${randomUUID()}`
    await prisma.role.createMany({
      data: [1, 2, 3].map((i) => ({ code: `${code}-${i}`, name: `Page ${i}` })),
    })
    const first = await request(app)
      .get('/api/access/roles')
      .query({ q: code, page: 1, limit: 2 })
      .set('Cookie', admin.cookie)
    const second = await request(app)
      .get('/api/access/roles')
      .query({ q: code, page: 2, limit: 2 })
      .set('Cookie', admin.cookie)
    expect(first.body.data.total).toBe(3)
    expect(first.body.data.items).toHaveLength(2)
    expect(second.body.data.items).toHaveLength(1)
    expect(first.body.data.items.map((role: { id: string }) => role.id)).not.toContain(
      second.body.data.items[0].id,
    )
    expect(first.body.data.items[0]).toHaveProperty('permissionCount')
    expect(first.body.data.items[0]).not.toHaveProperty('permissionCodes')
  })

  it('paginates the permission catalogue and validates page/size boundaries', async () => {
    const admin = await sessionFor()
    const first = await request(app)
      .get('/api/access/permissions')
      .query({ page: 1, limit: 2 })
      .set('Cookie', admin.cookie)
    const second = await request(app)
      .get('/api/access/permissions')
      .query({ page: 2, limit: 2 })
      .set('Cookie', admin.cookie)
    expect(first.body.data.items).toHaveLength(2)
    expect(second.body.data.items).toHaveLength(2)
    expect(first.body.data.total).toBe(second.body.data.total)
    expect(
      first.body.data.items.map((permission: { code: string }) => permission.code),
    ).not.toContain(second.body.data.items[0].code)
    const search = await request(app)
      .get('/api/access/permissions')
      .query({ q: 'prereg', limit: 2 })
      .set('Cookie', admin.cookie)
    expect(search.body.data.total).toBeGreaterThan(2)
    expect(
      search.body.data.items.every(
        (permission: { module: string }) => permission.module === 'prereg',
      ),
    ).toBe(true)
    for (const endpoint of ['/api/users', '/api/access/roles', '/api/access/permissions']) {
      for (const query of [{ page: 0 }, { page: 1001 }, { limit: 0 }, { limit: 101 }]) {
        expect(
          (await request(app).get(endpoint).query(query).set('Cookie', admin.cookie)).status,
        ).toBe(422)
      }
    }
  })
})
