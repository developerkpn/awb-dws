import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { createTestUser, sessionFor } from './helpers'

describe('Account filters', () => {
  it('combines multiple roles and plants before sorting, count and pagination', async () => {
    const admin = await sessionFor()
    const run = randomUUID()

    const accounts = await Promise.all(
      ['LOGISTIC', 'CUSTOMER', 'COMMERCIAL', 'CUSTOMER'].map((role) => createTestUser(role)),
    )

    const plants = await Promise.all(
      [0, 1, 2].map((i) =>
        prisma.plant.create({
          data: {
            code: `MULTI-${run}-${i}`,
            name: `Multi plant ${i}`,
          },
        }),
      ),
    )

    for (const [i, account] of accounts.entries()) {
      await prisma.user.update({
        where: { id: account.id },
        data: {
          name: `${run} ${i}`,
          plants: {
            create: { plantId: plants[i === 3 ? 2 : i === 2 ? 0 : i]!.id },
          },
        },
      })
    }

    const query = new URLSearchParams({
      q: run,
      limit: '1',
      sortBy: 'name',
      sortDirection: 'asc',
    })

    for (const role of ['LOGISTIC', 'CUSTOMER']) query.append('roles', role)
    for (const plant of plants.slice(0, 2)) query.append('plantIds', plant.id)
    const first = await request(app).get(`/api/users?${query}`).set('Cookie', admin.cookie)

    expect(first.status).toBe(200)
    expect(first.body.data.total).toBe(2)
    expect(first.body.data.items.map((item: { id: string }) => item.id)).toEqual([accounts[0]!.id])
    query.set('page', '2')
    const second = await request(app).get(`/api/users?${query}`).set('Cookie', admin.cookie)

    expect(second.body.data.items.map((item: { id: string }) => item.id)).toEqual([accounts[1]!.id])

    const single = await request(app)
      .get('/api/users')
      .query({
        q: run,
        roles: 'CUSTOMER',
        plantIds: plants[1]!.id,
      })
      .set('Cookie', admin.cookie)

    expect(single.body.data.total).toBe(1)
    const none = await request(app).get('/api/users').query({ q: run }).set('Cookie', admin.cookie)

    expect(none.body.data.total).toBe(4)

    for (const invalid of [
      { plantIds: 'not-a-uuid' },
      { roles: '' },
      {
        roles: Array.from({ length: 101 }, () => 'CUSTOMER'),
      },
    ]) {
      const params = new URLSearchParams()

      for (const [key, value] of Object.entries(invalid))
        for (const item of Array.isArray(value) ? value : [value]) params.append(key, item)

      expect(
        (await request(app).get(`/api/users?${params}`).set('Cookie', admin.cookie)).status,
      ).toBe(422)
    }
  })

  it('combines typed rules before counting and pagination, including literal wildcards and nulls', async () => {
    const admin = await sessionFor()
    const first = await createTestUser('LOGISTIC')
    const second = await createTestUser('CUSTOMER')
    const run = randomUUID()

    await prisma.user.update({
      where: { id: first.id },
      data: {
        name: `${run} 100%_ready`,
        email: null,
        createdAt: new Date('2026-02-05T12:00:00Z'),
      },
    })

    await prisma.user.update({
      where: { id: second.id },
      data: {
        name: `${run} 10000ready`,
        email: `${run}@example.test`,
      },
    })

    const list = (rules: unknown[], match = 'all') =>
      request(app)
        .get('/api/users')
        .query({
          filters: JSON.stringify({
            match,
            rules,
          }),
          limit: 1,
        })
        .set('Cookie', admin.cookie)

    const all = await list([
      {
        field: 'name',
        operator: 'contains',
        value: '100%_',
      },
      {
        field: 'name',
        operator: 'contains',
        value: run,
      },
      {
        field: 'email',
        operator: 'is_empty',
        value: '',
      },
      {
        field: 'createdAt',
        operator: 'equals',
        value: '2026-02-05',
      },
    ])

    expect(all.status).toBe(200)
    expect(all.body.data.total).toBe(1)
    expect(all.body.data.items[0].id).toBe(first.id)

    const literal = await list([
      {
        field: 'name',
        operator: 'contains',
        value: run,
      },
      {
        field: 'name',
        operator: 'contains',
        value: '100%_',
      },
    ])

    expect(literal.body.data.total).toBe(1)

    const any = await list(
      [
        {
          field: 'id',
          operator: 'equals',
          value: first.id,
        },
        {
          field: 'id',
          operator: 'equals',
          value: second.id,
        },
      ],
      'any',
    )

    expect(any.body.data.total).toBe(2)
    expect(any.body.data.items).toHaveLength(1)

    const negative = await list([
      {
        field: 'id',
        operator: 'equals',
        value: first.id,
      },
      {
        field: 'email',
        operator: 'not_contains',
        value: 'anything',
      },
    ])

    expect(negative.body.data.total).toBe(1)

    const nonEmpty = await list([
      {
        field: 'id',
        operator: 'equals',
        value: first.id,
      },
      {
        field: 'email',
        operator: 'is_not_empty',
        value: '',
      },
    ])

    expect(nonEmpty.body.data.total).toBe(0)

    const relation = await list([
      {
        field: 'id',
        operator: 'equals',
        value: second.id,
      },
      {
        field: 'role',
        operator: 'equals',
        value: 'customer',
      },
      {
        field: 'sapCode',
        operator: 'equals',
        value: second.username,
      },
    ])

    expect(relation.body.data.total).toBe(1)

    const plant = await prisma.plant.create({
      data: {
        code: `FILTER-${run}`,
        name: `Filter plant ${run}`,
      },
    })

    await prisma.user.update({
      where: { id: second.id },
      data: {
        username: `FILTER-${run}`,
        plants: {
          create: { plantId: plant.id },
        },
      },
    })

    const linked = await list([
      {
        field: 'sapCode',
        operator: 'contains',
        value: run,
      },
      {
        field: 'plant',
        operator: 'contains',
        value: run,
      },
    ])

    expect(linked.body.data.total).toBe(1)
    expect(linked.body.data.items[0].id).toBe(second.id)
  })

  it('rejects unknown fields, unsupported operators, invalid dates, excessive rules and unprivileged callers', async () => {
    const admin = await sessionFor()

    for (const rules of [
      [
        {
          field: 'passwordHash',
          operator: 'contains',
          value: 'x',
        },
      ],
      [
        {
          field: 'id',
          operator: 'contains',
          value: 'x',
        },
      ],
      [
        {
          field: 'createdAt',
          operator: 'equals',
          value: '2026-02-31',
        },
      ],
      Array.from({ length: 13 }, () => ({
        field: 'name',
        operator: 'equals',
        value: 'x',
      })),
    ]) {
      const response = await request(app)
        .get('/api/users')
        .query({
          filters: JSON.stringify({
            match: 'all',
            rules,
          }),
        })
        .set('Cookie', admin.cookie)

      expect(response.status).toBe(422)
    }

    expect(
      (await request(app).get('/api/users').query({ filters: '{oops' }).set('Cookie', admin.cookie))
        .status,
    ).toBe(422)

    const customer = await sessionFor('CUSTOMER')

    expect((await request(app).get('/api/users').set('Cookie', customer.cookie)).status).toBe(403)
  })
})
