import { Router } from 'express'
import { success } from '@awb/server-core'
import { currentUser, readToken, requireAuth, sessionCookie } from '../../middlewares/auth'
import service from './auth.service'
import { loginSchema } from './auth.schema'

const router = Router()

router.post('/login', async (req, res) => {
  const input = loginSchema.parse(req.body)
  const result = await service.login(input, req.ip ?? 'unknown')

  res.setHeader(
    'Set-Cookie',
    sessionCookie(result.token, input.rememberMe ? result.expiresAt : undefined),
  )

  res.json(success({ user: result.user }))
})

router.get('/me', requireAuth, (req, res) =>
  res.json(
    success({
      user: currentUser(req),
    }),
  ),
)

router.post('/logout', async (req, res) => {
  const token = readToken(req)

  if (token && /^[\w-]{43}$/.test(token)) await service.logout(token)

  res.setHeader('Set-Cookie', sessionCookie('', new Date(0)))
  res.status(204).end()
})

export default router
