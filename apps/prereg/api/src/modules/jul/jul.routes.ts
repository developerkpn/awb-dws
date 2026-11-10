import { Router } from 'express'
import { z } from 'zod'
import { success } from '@awb/server-core'
import { currentUser, requirePermission } from '../../middlewares/auth'
import {
  idParam,
  customerQuery,
  documentQuery,
  lookupQuery,
  listQuery,
  draftBody,
  versionBody,
  reasonBody,
  approvalBody,
  holdBody,
  retryBody,
} from './jul.schema'
import service from './jul.service'

const router = Router()

router.use(requirePermission('prereg:read'))

router.get('/configuration', async (req, res) => {
  res.json(success(await service.configuration(currentUser(req))))
})

router.get('/references', async (req, res) => {
  const query = customerQuery
    .extend({
      sto: z.string().trim().max(30).optional(),
    })
    .parse(req.query)

  res.json(success(await service.references(currentUser(req), query.customerId, query.sto)))
})

router.get('/documents', async (req, res) => {
  const query = documentQuery.parse(req.query)

  res.json(
    success(await service.document(currentUser(req), query.customerId, query.reference, query.sto)),
  )
})

router.get('/stos', async (req, res) => {
  const query = documentQuery.parse(req.query)

  res.json(success(await service.stos(currentUser(req), query.customerId, query.reference)))
})

router.get('/drivers', async (req, res) => {
  const query = lookupQuery.parse(req.query)

  res.json(success(await service.lookup(currentUser(req), query.customerId, query.q, 'drivers')))
})

router.get('/vehicles', async (req, res) => {
  const query = lookupQuery.parse(req.query)

  res.json(success(await service.lookup(currentUser(req), query.customerId, query.q, 'vehicles')))
})

router.get(
  '/documents/:id/approval-choices',
  requirePermission('prereg:approve'),
  async (req, res) => {
    res.json(success(await service.choices(idParam.parse(req.params).id, currentUser(req))))
  },
)

router.post('/holds', requirePermission('prereg:approve'), async (req, res) => {
  const body = holdBody.parse(req.body)

  res.json(
    success(await service.hold(body.documentId, body.quantity, body.reason, currentUser(req))),
  )
})

router.get('/', async (req, res) => {
  res.json(success(await service.list(listQuery.parse(req.query), currentUser(req))))
})

router.get('/:id', async (req, res) => {
  res.json(success(await service.get(idParam.parse(req.params).id, currentUser(req))))
})

router.post('/', requirePermission('prereg:create'), async (req, res) => {
  res.status(201).json(success(await service.save(draftBody.parse(req.body), currentUser(req))))
})

router.put('/:id', requirePermission('prereg:update'), async (req, res) => {
  res.json(
    success(
      await service.save(draftBody.parse(req.body), currentUser(req), idParam.parse(req.params).id),
    ),
  )
})

router.post('/:id/submit', requirePermission('prereg:update'), async (req, res) => {
  res.json(
    success(
      await service.submit(
        idParam.parse(req.params).id,
        versionBody.parse(req.body).version,
        currentUser(req),
      ),
    ),
  )
})

router.post('/:id/cancel', requirePermission('prereg:update'), async (req, res) => {
  const body = reasonBody.parse(req.body)

  res.json(
    success(
      await service.cancel(
        idParam.parse(req.params).id,
        body.version,
        body.reason,
        currentUser(req),
      ),
    ),
  )
})

router.post('/:id/approve', requirePermission('prereg:approve'), async (req, res) => {
  res.json(
    success(
      await service.approve(
        idParam.parse(req.params).id,
        approvalBody.parse(req.body),
        currentUser(req),
      ),
    ),
  )
})

router.post('/:id/reconcile', async (req, res) => {
  res.json(success(await service.reconcile(idParam.parse(req.params).id, currentUser(req))))
})

router.post('/:id/jobs/:jobId/resume', requirePermission('prereg:approve'), async (req, res) => {
  const params = z
    .object({
      id: z.uuid(),
      jobId: z.uuid(),
    })
    .parse(req.params)

  res.json(
    success(
      await service.resume(
        params.id,
        params.jobId,
        retryBody.parse(req.body).sapPassword,
        currentUser(req),
      ),
    ),
  )
})

export default router
