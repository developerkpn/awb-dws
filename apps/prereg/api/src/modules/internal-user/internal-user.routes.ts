import { Router, type Request, type Response, type NextFunction } from 'express'
import { CustomError, success } from '@awb/server-core'
import service from './internal-user.service'
import {
  createInternalUserSchema,
  loginSchema,
  updateInternalUserSchema,
  updateStatusSchema,
  userIdParam,
} from './internal-user.schema'

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  // Support role in header (x-user-role) or custom auth context
  const role = req.headers['x-user-role'] || (req as any).user?.role
  if (role !== 'ADMIN') {
    throw new CustomError('Access denied: ADMIN role required', 403)
  }
  next()
}

const router = Router()

// Public Auth: Login with active/inactive check
router.post('/login', async (req, res) => {
  const input = loginSchema.parse(req.body)
  const result = await service.login(input)
  res.json(success(result))
})

// ADMIN Only: List all internal staff accounts
router.get('/', requireAdmin, async (_req, res) => {
  const users = await service.listInternalUsers()
  res.json(success(users))
})

// ADMIN Only: Get single internal user detail
router.get('/:id', requireAdmin, async (req, res) => {
  const { id } = userIdParam.parse(req.params)
  const user = await service.getById(id)
  res.json(success(user))
})

// ADMIN Only: Create new internal user
router.post('/', requireAdmin, async (req, res) => {
  const input = createInternalUserSchema.parse(req.body)
  const result = await service.createInternalUser(input)
  res.status(201).json(success(result))
})

// ADMIN Only: Update internal user data
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = userIdParam.parse(req.params)
  const input = updateInternalUserSchema.parse(req.body)
  const updated = await service.updateInternalUser(id, input)
  res.json(success(updated))
})

// ADMIN Only: Toggle active / inactive status
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { id } = userIdParam.parse(req.params)
  const { isActive } = updateStatusSchema.parse(req.body)
  const updated = await service.setStatus(id, isActive)
  res.json(success(updated))
})

// ADMIN Only: Reset password
router.post('/:id/reset-password', requireAdmin, async (req, res) => {
  const { id } = userIdParam.parse(req.params)
  const result = await service.resetPassword(id)
  res.json(success(result))
})

export default router
