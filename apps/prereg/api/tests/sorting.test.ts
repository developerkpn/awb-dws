import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { accountSortFields, permissionSortFields, roleSortFields } from '@awb/contracts'
import { sessionFor } from './helpers'

describe('Server table sorting', () => {
  it('sorts filtered accounts before pagination and uses UUIDs to break ties', async () => {
    const admin = await sessionFor()
    const prefix = `sort-${randomUUID()}`
    const created = await Promise.all(
      ['Zulu', 'Alpha', 'Alpha', 'Middle'].map((name, index) =>
        prisma.user.create({
          data: {
            name: `${prefix} ${name}`,
            username: `${prefix}-${index}`,
            accountType: 'INTERNAL',
            roleId: admin.user.roleId,
            passwordHash: 'unused-test-hash',
            isActive: index !== 3,
          },
        }),
      ),
    )
    const where = { username: { startsWith: prefix }, isActive: true }
    for (const direction of ['asc', 'desc'] as const) {
      const expected = await prisma.user.findMany({
        where,
        orderBy: [{ name: direction }, { id: direction }],
      })
      const ids: string[] = []
      for (const page of [1, 2]) {
        const response = await request(app)
          .get('/api/users')
          .set('Cookie', admin.cookie)
          .query({
            q: prefix,
            page,
            limit: 2,
            sortBy: 'name',
            sortDirection: direction,
            filters: JSON.stringify({
              match: 'all',
              rules: [{ field: 'isActive', operator: 'equals', value: 'true' }],
            }),
          })
        expect(response.status).toBe(200)
        expect(response.body.data.total).toBe(3)
        ids.push(...response.body.data.items.map((user: { id: string }) => user.id))
      }
      expect(ids).toEqual(expected.map((user) => user.id))
    }
    expect(created).toHaveLength(4)
  })

  it('orders role assignments and permission actions on the server while preserving module groups', async () => {
    const admin = await sessionFor()
    const prefix = `SORT-${randomUUID()}`
    const permission = await prisma.permission.findFirstOrThrow()
    await prisma.role.createMany({
      data: [0, 1, 2].map((i) => ({ code: `${prefix}-${i}`, name: `Role ${i}` })),
    })
    const role = await prisma.role.findUniqueOrThrow({ where: { code: `${prefix}-1` } })
    await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } })
    const roles = await request(app)
      .get('/api/access/roles')
      .set('Cookie', admin.cookie)
      .query({ q: prefix, sortBy: 'permissionCount', sortDirection: 'desc', limit: 1 })
    expect(roles.status).toBe(200)
    expect(roles.body.data.total).toBe(3)
    expect(roles.body.data.items[0].id).toBe(role.id)
    for (const direction of ['asc', 'desc']) {
      const response = await request(app)
        .get('/api/access/permissions')
        .set('Cookie', admin.cookie)
        .query({ sortBy: 'action', sortDirection: direction, limit: 100 })
      expect(response.status).toBe(200)
      const items = response.body.data.items as { code: string; module: string }[]
      const expected = [...items].sort(
        (a, b) =>
          a.module.localeCompare(b.module) ||
          a.code.split(':').at(-1)!.localeCompare(b.code.split(':').at(-1)!) *
            (direction === 'asc' ? 1 : -1) ||
          a.code.localeCompare(b.code),
      )
      expect(items).toEqual(expected)
      const filtered = await request(app)
        .get('/api/access/permissions')
        .set('Cookie', admin.cookie)
        .query({
          sortBy: 'action',
          sortDirection: direction,
          q: 'prereg',
          module: 'prereg',
          page: 2,
          limit: 2,
        })
      expect(filtered.body.data.items).toEqual(
        items.filter((item) => item.module === 'prereg').slice(2, 4),
      )
      const literal = await request(app)
        .get('/api/access/permissions')
        .set('Cookie', admin.cookie)
        .query({ sortBy: 'action', q: '%' })
      expect(literal.body.data.total).toBe(0)
    }
  })

  it('accepts only supported sort keys and directions for each endpoint', async () => {
    const admin = await sessionFor()
    for (const [endpoint, fields] of [
      ['/api/users', accountSortFields],
      ['/api/access/roles', roleSortFields],
      ['/api/access/permissions', permissionSortFields],
    ] as const) {
      for (const sortBy of fields) {
        expect(
          (
            await request(app)
              .get(endpoint)
              .set('Cookie', admin.cookie)
              .query({ sortBy, sortDirection: 'desc' })
          ).status,
        ).toBe(200)
      }
      for (const query of [
        { sortBy: 'passwordHash' },
        { sortBy: 'name; DROP TABLE mst_user' },
        { sortDirection: 'invalid' },
      ]) {
        expect(
          (await request(app).get(endpoint).set('Cookie', admin.cookie).query(query)).status,
        ).toBe(422)
      }
    }
  })
})
