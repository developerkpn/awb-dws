import { Router } from 'express'
import preRegistrationRouter from '../modules/pre-registration/pre-registration.routes'
import internalUserRouter from '../modules/internal-user/internal-user.routes'
import rolePermissionRouter from '../modules/role-permission/role-permission.routes'
import internalRouter from './internal'
import authRouter from '../modules/auth/auth.routes'
import { requireAuth, requirePermission } from '../middlewares/auth'
import documentRouter from '../modules/document/document.routes'
import driverRequestRouter from '../modules/driver-request/driver-request.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/users', requireAuth, internalUserRouter)
router.use('/internal-users', requireAuth, internalUserRouter)
router.use('/access', requireAuth, rolePermissionRouter)
router.use('/documents', requireAuth, documentRouter)
router.use('/driver-requests', requireAuth, driverRequestRouter)
router.use(
  '/pre-registrations',
  requireAuth,
  requirePermission('prereg:read'),
  preRegistrationRouter,
)
router.use('/internal', requireAuth, requirePermission('sync:internal'), internalRouter)

export default router
