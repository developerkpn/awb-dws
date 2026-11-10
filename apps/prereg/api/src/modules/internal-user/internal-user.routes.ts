import { Router } from 'express'
import { success } from '@awb/server-core'
import { currentUser, requireAdmin, requirePermission } from '../../middlewares/auth'
import service from './internal-user.service'
import {
  accountSchema,
  listUsersSchema,
  updateStatusSchema,
  userIdParam,
} from './internal-user.schema'

const router = Router()

router.use(requireAdmin, requirePermission('admin:users:read'))

router.get('/', async (req, res) =>
  res.json(success(await service.list(listUsersSchema.parse(req.query)))),
)

router.get('/options', async (_req, res) => res.json(success(await service.options())))

router.get('/:id', async (req, res) =>
  res.json(success(await service.getById(userIdParam.parse(req.params).id))),
)

router.post('/', requirePermission('admin:users:create'), async (req, res) => {
  res
    .status(201)
    .json(success(await service.create(accountSchema.parse(req.body), currentUser(req).id)))
})

router.put('/:id', requirePermission('admin:users:update'), async (req, res) => {
  res.json(
    success(
      await service.update(
        userIdParam.parse(req.params).id,
        accountSchema.parse(req.body),
        currentUser(req).id,
      ),
    ),
  )
})

router.patch('/:id/status', requirePermission('admin:users:update'), async (req, res) => {
  res.json(
    success(
      await service.setStatus(
        userIdParam.parse(req.params).id,
        updateStatusSchema.parse(req.body).isActive,
        currentUser(req).id,
      ),
    ),
  )
})

router.post(
  '/:id/reset-password',
  requirePermission('admin:users:reset-password'),
  async (req, res) => {
    res.json(
      success(await service.resetPassword(userIdParam.parse(req.params).id, currentUser(req).id)),
    )
  },
)

export default router
