import { Router } from 'express'
import { success } from '@awb/server-core'
import { currentUser, requirePermission } from '../../middlewares/auth'
import { reportExportQuery, reportListQuery } from './registration-report.schema'
import service from './registration-report.service'

const router = Router()

router.get('/', requirePermission('prereg:read'), async (req, res) => {
  const query = reportListQuery.parse(req.query)

  res.json(success(await service.list(query, currentUser(req))))
})

router.get('/options', requirePermission('prereg:read'), async (req, res) => {
  res.json(success(await service.options(currentUser(req))))
})

router.get('/export', requirePermission('prereg:read'), async (req, res) => {
  const query = reportExportQuery.parse(req.query)
  const file = await service.exportExcel(query, currentUser(req))

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`)
  res.send(file.buffer)
})

export default router
