import { Router } from 'express'
import { success } from '@awb/server-core'
import syncService from './sync.service'
import syncRepository from './sync.repository'
import { startSyncWorker, stopSyncWorker, isSyncWorkerRunning } from './sync.worker'

// Sync with HO (Customer Pre-Registration on AWS). Other domains import only from this file.
export const syncRouter = Router()

syncRouter.get('/status', async (_req, res) => {
  const status = await syncService.getStatus()
  res.json(
    success({
      ...status,
      workerRunning: isSyncWorkerRunning(),
    }),
  )
})

syncRouter.post('/pull', async (_req, res) => {
  const result = await syncService.pullAndProcess()
  res.json(success(result))
})

export { startSyncWorker, stopSyncWorker, isSyncWorkerRunning, syncService, syncRepository }
