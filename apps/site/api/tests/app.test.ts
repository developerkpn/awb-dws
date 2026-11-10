import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app'

describe('site-api', () => {
  it('reports health', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    expect(res.body.data).toMatchObject({
      service: 'site-api',
      controllers: {},
    })
  })

  it('returns a 404 error body for an unknown id', async () => {
    const res = await request(app).get(`/api/journeys/${randomUUID()}`)

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Journey not found' })
  })

  it('rejects an id that is not a UUID', async () => {
    const res = await request(app).get('/api/journeys/not-a-uuid')

    expect(res.status).toBe(422)
    expect(res.body.details).toHaveProperty('id')
  })
})
