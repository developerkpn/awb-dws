import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app'
import { sessionFor } from './helpers'

describe('prereg-api', () => {
  it('reports health', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual({ service: 'prereg-api' })
  })

  it('returns a 404 error body for an unknown id', async () => {
    const { cookie } = await sessionFor()
    const res = await request(app)
      .get(`/api/pre-registrations/${randomUUID()}`)
      .set('Cookie', cookie)
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Pre-registration not found' })
  })

  it('rejects an id that is not a UUID', async () => {
    const { cookie } = await sessionFor()
    const res = await request(app).get('/api/pre-registrations/not-a-uuid').set('Cookie', cookie)
    expect(res.status).toBe(422)
    expect(res.body.details).toHaveProperty('id')
  })
})
