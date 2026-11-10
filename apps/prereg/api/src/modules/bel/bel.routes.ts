import { Router } from 'express'
import { success } from '@awb/server-core'
import { currentUser, requirePermission, disallowRole } from '../../middlewares/auth'

const router = Router()

router.use(disallowRole(['CUSTOMER']))
router.use(requirePermission('prereg:read'))

router.get('/configuration', async (req, res) => {
  res.json(success({ role: currentUser(req).role }))
})

router.get('/', async (_req, res) => {
  res.json(
    success({
      items: [],
      total: 0,
    }),
  )
})

export default router
