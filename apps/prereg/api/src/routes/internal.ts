import { Router } from 'express'
import { success } from '@awb/server-core'
import { syncOutboxQuerySchema, syncAckSchema } from '../modules/sync/sync.schema'
import syncService from '../modules/sync/sync.service'

const router = Router()

router.get('/sync/outbox', async (req, res) => {
  const query = syncOutboxQuerySchema.parse(req.query)
  const result = await syncService.getOutboxMessages(query.after, query.limit, query.siteId)
  res.json(success(result))
})

router.post('/sync/ack', async (req, res) => {
  const body = syncAckSchema.parse(req.body)
  const result = await syncService.acknowledge(body.upTo, body.siteId)
  res.json(success(result))
})

export default router
