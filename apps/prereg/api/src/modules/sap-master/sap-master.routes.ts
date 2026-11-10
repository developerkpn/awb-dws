import { Router } from 'express'
import { success } from '@awb/server-core'
import { currentUser, requireAdmin } from '../../middlewares/auth'
import service from './sap-master.service'

const router = Router()

router.use(requireAdmin)

router.get('/', async (_req, res) => {
  res.json(success(await service.summary()))
})

router.post('/imports', async (req, res) => {
  res.status(202).json(success(await service.startImport(currentUser(req))))
})

export default router
