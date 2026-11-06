import { Router, type Request } from 'express'
import { CustomError, success } from '@awb/server-core'
import { syncOutboxQuerySchema, syncAckSchema } from '../modules/sync/sync.schema'
import syncService from '../modules/sync/sync.service'

const router = Router()

function resolveSite(req: Request, requested?: string) {
  if (req.serviceSiteId && requested && req.serviceSiteId !== requested) {
    throw new CustomError('Service credentials do not allow this site', 403)
  }
  const site = req.serviceSiteId ?? requested
  if (!site) throw new CustomError('Supply the destination site', 422)
  return site
}

router.get('/sync/outbox', async (req, res) => {
  const query = syncOutboxQuerySchema.parse(req.query)
  const result = await syncService.getOutboxMessages(
    query.after,
    query.limit,
    resolveSite(req, query.siteId),
  )
  res.json(success(result))
})

router.post('/sync/ack', async (req, res) => {
  const body = syncAckSchema.parse(req.body)
  const result = await syncService.acknowledge(body.upTo, resolveSite(req, body.siteId))
  res.json(success(result))
})

export default router
