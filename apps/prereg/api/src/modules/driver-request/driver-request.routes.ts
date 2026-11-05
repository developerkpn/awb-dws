import { Router } from 'express'
import { success } from '@awb/server-core'
import { currentUser, requirePermission } from '../../middlewares/auth'
import { listDriverRequests } from './driver-request.schema'
import service from './driver-request.service'

const router = Router()

router.get('/', requirePermission('prereg:read'), async (req, res) => {
  const query = listDriverRequests.parse(req.query)
  res.json(success(await service.list(query, currentUser(req))))
})

export default router
