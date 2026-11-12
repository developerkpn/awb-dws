import { Router } from 'express'
import { success } from '@awb/server-core'
import { operatorLoginInput } from '@awb/contracts'
import { currentOperator, readToken, requireAuth, sessionCookie } from '../../middlewares/auth'
import service from './auth.service'

const router = Router()

router.post('/login', async (req, res) => {
  const input = operatorLoginInput.parse(req.body)
  const result = await service.login(input, req.ip ?? 'unknown')

  // Remember me keeps the cookie across browser restarts; otherwise it ends with the browser.
  res.setHeader(
    'Set-Cookie',
    sessionCookie(result.token, input.rememberMe ? result.expiresAt : undefined),
  )

  res.json(success({ user: result.user }))
})

router.get('/me', requireAuth, (req, res) => {
  res.json(
    success({
      user: currentOperator(req),
    }),
  )
})

router.post('/logout', async (req, res) => {
  const token = readToken(req)

  if (token) await service.logout(token)

  res.setHeader('Set-Cookie', sessionCookie('', new Date(0)))
  res.status(204).end()
})

export default router
