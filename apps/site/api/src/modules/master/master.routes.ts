import { Router } from 'express'
import { CustomError, NotFoundError, success } from '@awb/server-core'
import { masterKind, masterListQuery } from '@awb/contracts'
import { currentOperator, requireAuth } from '../../middlewares/auth'
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

router.post('/:kind/pull', async (req, res) => {
  if (currentOperator(req).role !== 'ADMIN')
    throw new CustomError('Only an admin can pull master data', 403)

  res.json(success(await service.pull(kindOf(req.params.kind))))
})

export default router
