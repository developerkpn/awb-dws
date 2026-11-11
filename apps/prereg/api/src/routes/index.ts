import { Router } from 'express'
import internalUserRouter from '../modules/internal-user/internal-user.routes'
import rolePermissionRouter from '../modules/role-permission/role-permission.routes'
import internalRouter from './internal'
import authRouter from '../modules/auth/auth.routes'
import { requireAuth } from '../middlewares/auth'
import { requireServiceAuth } from '../middlewares/service-auth'
import documentRouter from '../modules/document/document.routes'
import driverRequestRouter from '../modules/driver-request/driver-request.routes'
import belRouter from '../modules/bel/bel.routes'
import julRouter from '../modules/jul/jul.routes'
import registrationReportRouter from '../modules/registration-report/registration-report.routes'
import sapMasterRouter from '../modules/sap-master/sap-master.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/users', requireAuth, internalUserRouter)
router.use('/internal-users', requireAuth, internalUserRouter)
router.use('/access', requireAuth, rolePermissionRouter)
router.use('/documents', requireAuth, documentRouter)
router.use('/driver-requests', requireAuth, driverRequestRouter)
router.use('/bel', requireAuth, belRouter)
router.use('/jul', requireAuth, julRouter)
router.use('/registration-reports', requireAuth, registrationReportRouter)
router.use('/sap-master', requireAuth, sapMasterRouter)
router.use('/internal', requireServiceAuth, internalRouter)

export default router
