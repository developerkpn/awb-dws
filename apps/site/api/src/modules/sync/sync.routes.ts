import { Router } from 'express'
import { success } from '@awb/server-core'
import syncService from './sync.service'
import { isSyncWorkerRunning } from './sync.worker'
import { requireServiceAuth } from '../../middlewares/service-auth'

const router = Router()

router.get('/status', async (_req, res) => {
  const status = await syncService.getStatus()
  res.json(
    success({
      ...status,
      workerRunning: isSyncWorkerRunning(),
    }),
  )
})

router.post('/pull', requireServiceAuth, async (_req, res) => {
  const result = await syncService.pullAndProcess()
  res.json(success(result))
})

export default router
