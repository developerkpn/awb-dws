import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { createOperator, ORIGIN, PASSWORD, resetOperators, signIn } from './helpers'

describe('operator auth', () => {
  beforeAll(async () => {
    await resetOperators('authtest_')
    await createOperator('authtest_active')
    await createOperator('authtest_inactive', { isActive: false })
  })

  afterAll(() => resetOperators('authtest_'))

  it('signs in with an HTTP-only session cookie and returns the operator', async () => {
    const res = await request(app).post('/api/auth/login').set('Origin', ORIGIN).send({
      username: 'authtest_active',
      password: PASSWORD,
    })

    expect(res.status).toBe(200)

    expect(res.body.data.user).toMatchObject({
      username: 'authtest_active',
      role: 'OPERATOR',
    })

    const cookie = String(res.headers['set-cookie'])

    expect(cookie).toMatch(/awb_site_session=[\w-]{43}/)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Path=/api')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).not.toContain('Expires')
  })

  it('keeps the session cookie for 14 days with remember me', async () => {
    const res = await request(app).post('/api/auth/login').set('Origin', ORIGIN).send({
      username: 'authtest_active',
      password: PASSWORD,
      rememberMe: true,
    })

    expect(res.status).toBe(200)

    const expires = /Expires=([^;]+)/.exec(String(res.headers['set-cookie']))?.[1]
    const days = (new Date(expires ?? 0).getTime() - Date.now()) / 86_400_000

    expect(days).toBeGreaterThan(13.9)
    expect(days).toBeLessThanOrEqual(14)
  })

  it('rejects a wrong password, an unknown user and an inactive account the same way', async () => {
    for (const [username, password] of [
      ['authtest_active', 'wrong-password'],
      ['authtest_nobody', PASSWORD],
      ['authtest_inactive', PASSWORD],
    ]) {
      const res = await request(app).post('/api/auth/login').set('Origin', ORIGIN).send({
        username,
        password,
      })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid username or password')
    }
  })

  it('requires a session for /me and ends it on logout', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401)

    const agent = await signIn('authtest_active')
    const me = await agent.get('/api/auth/me')

    expect(me.status).toBe(200)
    expect(me.body.data.user.username).toBe('authtest_active')

    expect((await agent.post('/api/auth/logout').set('Origin', ORIGIN)).status).toBe(204)
    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })

  it('refuses writes from another origin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://evil.example')
      .send({
        username: 'authtest_active',
        password: PASSWORD,
      })

    expect(res.status).toBe(403)
  })
})
