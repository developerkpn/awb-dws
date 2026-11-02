import { Router } from 'express'
import { success } from '@awb/server-core'
import { journeyIdParam } from './journey.schema'
import journeyService from './journey.service'

const router = Router()

router.get('/:id', async (req, res) => {
  const { id } = journeyIdParam.parse(req.params)
  res.json(success(await journeyService.findByIdOrFail(id)))
})

export default router
