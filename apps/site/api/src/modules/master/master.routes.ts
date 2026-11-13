import { Router } from 'express'
import { NotFoundError, success } from '@awb/server-core'
import { masterKind, masterListQuery } from '@awb/contracts'
import { requireAuth } from '../../middlewares/auth'
import service from './master.service'

const router = Router()

router.use(requireAuth)

function kindOf(value: unknown) {
  const parsed = masterKind.safeParse(value)

  if (!parsed.success) throw new NotFoundError('Unknown master')

  return parsed.data
}

router.get('/', async (_req, res) => {
  res.json(success(await service.statuses()))
})

router.get('/:kind', async (req, res) => {
  res.json(success(await service.list(kindOf(req.params.kind), masterListQuery.parse(req.query))))
})

router.post('/pull', async (_req, res) => {
  await service.pullAll()
  res.json(success(await service.statuses()))
})

router.post('/:kind/pull', async (req, res) => {
  res.json(success(await service.pull(kindOf(req.params.kind))))
})

export default router
