import { Router } from 'express'
import { success } from '@awb/server-core'
import { registrationCreateInput, registrationListQuery } from '@awb/contracts'
import { currentOperator, requireAuth } from '../../middlewares/auth'
import service from './registration.service'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  res.json(success(await service.list(registrationListQuery.parse(req.query))))
})

router.post('/', async (req, res) => {
  const data = registrationCreateInput.parse(req.body)

  res.status(201).json(success(await service.create(data, currentOperator(req).id)))
})

export default router
