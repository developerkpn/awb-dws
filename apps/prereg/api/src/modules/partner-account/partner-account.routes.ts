import { Router } from 'express'
import { success } from '@awb/server-core'
import { requireAdmin } from '../../middlewares/auth.middleware'
import {
  createPartnerAccountSchema,
  idParamSchema,
  partnerQuerySchema,
  updateStatusSchema,
} from './partner-account.schema'
import partnerAccountService from './partner-account.service'

const router = Router()

// Public / Form helper: get SAP partner list (filtered by role and availability)
router.get('/partners', async (req, res) => {
  const query = partnerQuerySchema.parse(req.query)
  const availableOnly = query.available !== 'false'
  const partners = await partnerAccountService.getAvailablePartners(query.role, availableOnly)
  res.json(success(partners))
})

// Admin only: list existing partner accounts
router.get('/partner-accounts', requireAdmin, async (_req, res) => {
  const accounts = await partnerAccountService.listAccounts()
  res.json(success(accounts))
})

// Admin only: create new partner account
router.post('/partner-accounts', requireAdmin, async (req, res) => {
  const input = createPartnerAccountSchema.parse(req.body)
  const user = await partnerAccountService.createPartnerAccount(input)
  res.status(201).json(success(user))
})

// Admin only: toggle active / inactive status
router.patch('/partner-accounts/:id/status', requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  const { isActive } = updateStatusSchema.parse(req.body)
  const user = await partnerAccountService.updateStatus(id, isActive)
  res.json(success(user))
})

// Admin only: reset password and send email
router.post('/partner-accounts/:id/reset-password', requireAdmin, async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  const result = await partnerAccountService.resetPassword(id)
  res.json(success(result))
})

export default router

