import { Router } from 'express'
import preRegistrationRouter from '../modules/pre-registration/pre-registration.routes'
import internalUserRouter from '../modules/internal-user/internal-user.routes'
import rolePermissionRouter from '../modules/role-permission/role-permission.routes'
import internalRouter from './internal'

const router = Router()

router.use('/pre-registrations', preRegistrationRouter)
router.use('/internal-users', internalUserRouter)
router.use('/auth', internalUserRouter)
router.use('/access', rolePermissionRouter)
router.use('/internal', internalRouter)

export default router
