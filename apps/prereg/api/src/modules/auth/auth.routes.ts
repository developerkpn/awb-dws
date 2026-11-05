import { Router } from 'express'
import { success } from '@awb/server-core'
import { clearSessionCookie, serializeSessionCookie } from '../../helpers/session'
import { requireAuth } from '../../middlewares/auth.middleware'
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from './auth.schema'
import authService from './auth.service'

const router = Router()

router.post('/login', async (req, res) => {
  const input = loginSchema.parse(req.body)
  const clientKey = `${req.ip || 'client'}:${input.username}`
  const result = await authService.login(input, clientKey)

  res.setHeader('Set-Cookie', serializeSessionCookie(result.sessionToken))
  res.json(success(result.user))
})

router.post('/logout', (_req, res) => {
  res.setHeader('Set-Cookie', clearSessionCookie())
  res.json(success({ message: 'Logout berhasil' }))
})

router.get('/me', requireAuth, (req, res) => {
  res.json(success(authService.formatUserProfile(req.user!)))
})

router.post('/forgot-password', async (req, res) => {
  const input = forgotPasswordSchema.parse(req.body)
  const result = await authService.forgotPassword(input)
  res.json(success(result))
})

router.post('/reset-password', async (req, res) => {
  const input = resetPasswordSchema.parse(req.body)
  const result = await authService.resetPassword(input)
  res.json(success(result))
})

export default router
