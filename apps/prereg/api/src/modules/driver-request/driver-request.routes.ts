import { Router } from 'express'
import { CustomError, success } from '@awb/server-core'
import { currentUser, requirePermission } from '../../middlewares/auth'
import { listDriverRequests, approveDriverRequestSchema } from './driver-request.schema'
import service from './driver-request.service'

const router = Router()

router.get('/', requirePermission('prereg:read'), async (req, res) => {
  const query = listDriverRequests.parse(req.query)
  res.json(success(await service.list(query, currentUser(req))))
})

router.post('/:id/approve', requirePermission('prereg:approve'), async (req, res) => {
  const id = req.params.id
  if (typeof id !== 'string') {
    throw new CustomError('Invalid driver request id', 400)
  }
  const input = approveDriverRequestSchema.parse(req.body)
  const result = await service.approve(id, currentUser(req), input)
  res.json(success(result))
})

export default router
