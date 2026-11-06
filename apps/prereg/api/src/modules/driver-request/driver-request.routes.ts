import { z } from 'zod'
import { Router } from 'express'
import { success } from '@awb/server-core'
import { currentUser, requirePermission } from '../../middlewares/auth'
import {
  listDriverRequests,
  driverRequestBody,
  approveDriverRequestSchema,
} from './driver-request.schema'
import service from './driver-request.service'

const idParam = z.object({ id: z.uuid() })

const router = Router()

router.get('/transporters', requirePermission('prereg:read'), async (_req, res) => {
  res.json(success(await service.listTransporters()))
})

router.get('/', requirePermission('prereg:read'), async (req, res) => {
  const query = listDriverRequests.parse(req.query)
  res.json(success(await service.list(query, currentUser(req))))
})

router.get('/:id', requirePermission('prereg:read'), async (req, res) => {
  const { id } = idParam.parse(req.params)
  res.json(success(await service.getById(id, currentUser(req))))
})

router.post('/', requirePermission('prereg:create'), async (req, res) => {
  const body = driverRequestBody.parse(req.body)
  res.status(201).json(success(await service.create(body, currentUser(req))))
})

router.put('/:id', requirePermission('prereg:update'), async (req, res) => {
  const { id } = idParam.parse(req.params)
  const body = driverRequestBody.parse(req.body)
  res.json(success(await service.resubmit(id, body, currentUser(req))))
})

router.post('/:id/approve', requirePermission('prereg:approve'), async (req, res) => {
  const { id } = idParam.parse(req.params)
  const input = approveDriverRequestSchema.parse(req.body)
  res.json(success(await service.approve(id, currentUser(req), input)))
})

export default router
