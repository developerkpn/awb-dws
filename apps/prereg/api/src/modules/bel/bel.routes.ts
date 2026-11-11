import { Router } from 'express'
import { success } from '@awb/server-core'
import { currentUser, disallowRole, requirePermission } from '../../middlewares/auth'
import {
  approveBody,
  belListQuery,
  draftBody,
  idParam,
  lookupQuery,
  poItemQuery,
  reasonBody,
  versionBody,
} from './bel.schema'
import service from './bel.service'

const router = Router()

router.use(disallowRole(['CUSTOMER']))

router.get('/vendors', requirePermission('prereg:read'), async (req, res) => {
  res.json(success(await service.vendors(currentUser(req))))
})

router.get('/po-items', requirePermission('prereg:read'), async (req, res) => {
  const query = poItemQuery.parse(req.query)

  res.json(success(await service.poItems(currentUser(req), query.vendorId)))
})

router.get('/drivers', requirePermission('prereg:read'), async (req, res) => {
  const query = lookupQuery.parse(req.query)

  res.json(success(await service.drivers(currentUser(req), query.q, query.vendorId)))
})

router.get('/vehicles', requirePermission('prereg:read'), async (req, res) => {
  const query = lookupQuery.parse(req.query)

  res.json(success(await service.vehicles(currentUser(req), query.q, query.vendorId)))
})

router.get('/', requirePermission('prereg:read'), async (req, res) => {
  const query = belListQuery.parse(req.query)

  res.json(success(await service.list(query, currentUser(req))))
})

router.get('/:id', requirePermission('prereg:read'), async (req, res) => {
  const { id } = idParam.parse(req.params)

  res.json(success(await service.getById(id, currentUser(req))))
})

router.post('/', requirePermission('prereg:create'), async (req, res) => {
  const body = draftBody.parse(req.body)

  res.status(201).json(success(await service.create(body, currentUser(req))))
})

router.put('/:id', requirePermission('prereg:update'), async (req, res) => {
  const { id } = idParam.parse(req.params)
  const body = draftBody.parse(req.body)

  res.json(success(await service.update(id, body, currentUser(req))))
})

router.post('/:id/submit', requirePermission('prereg:update'), async (req, res) => {
  const { id } = idParam.parse(req.params)
  const body = versionBody.parse(req.body ?? {})

  res.json(success(await service.submit(id, currentUser(req), body.version)))
})

router.post('/:id/approve', requirePermission('prereg:approve'), async (req, res) => {
  const { id } = idParam.parse(req.params)
  const body = approveBody.parse(req.body ?? {})

  res.json(success(await service.approve(id, currentUser(req), body)))
})

router.post('/:id/reject', requirePermission('prereg:approve'), async (req, res) => {
  const { id } = idParam.parse(req.params)
  const body = reasonBody.parse(req.body)

  res.json(success(await service.reject(id, currentUser(req), body)))
})

router.post('/:id/cancel', requirePermission('prereg:update'), async (req, res) => {
  const { id } = idParam.parse(req.params)
  const body = reasonBody.parse(req.body)

  res.json(success(await service.cancel(id, currentUser(req), body)))
})

export default router
