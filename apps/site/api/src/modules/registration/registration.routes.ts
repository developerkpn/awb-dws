import { Router } from 'express'
import { success } from '@awb/server-core'
import {
  registrationCardNumber,
  registrationCreateInput,
  registrationListQuery,
} from '@awb/contracts'
import { currentOperator, requireAuth } from '../../middlewares/auth'
import service from './registration.service'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  res.json(success(await service.list(registrationListQuery.parse(req.query))))
})

router.get('/cards/:cardNumber', async (req, res) => {
  res.json(success(await service.cardStatus(registrationCardNumber.parse(req.params.cardNumber))))
})

router.get('/:id/driver-photo', async (req, res) => {
  const photo = await service.driverPhoto(req.params.id)

  res
    .set('Cache-Control', 'private, max-age=3600')
    .type(photo.mimeType)
    .send(Buffer.from(photo.content))
})

router.post('/', async (req, res) => {
  const data = registrationCreateInput.parse(req.body)

  res.status(201).json(success(await service.create(data, currentOperator(req).id)))
})

export default router
