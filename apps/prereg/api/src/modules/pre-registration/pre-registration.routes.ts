import { Router } from 'express'
import { success } from '@awb/server-core'
import { preRegistrationIdParam } from './pre-registration.schema'
import preRegistrationService from './pre-registration.service'

const router = Router()

router.get('/:id', async (req, res) => {
  const { id } = preRegistrationIdParam.parse(req.params)
  res.json(success(await preRegistrationService.findByIdOrFail(id)))
})

export default router
