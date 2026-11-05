import { Router } from 'express'
import authRouter from '../modules/auth/auth.routes'
import documentRouter from '../modules/document/document.routes'
import partnerAccountRouter from '../modules/partner-account/partner-account.routes'
import preRegistrationRouter from '../modules/pre-registration/pre-registration.routes'
import internalRouter from './internal'

const router = Router()

router.use('/auth', authRouter)
router.use('/documents', documentRouter)
router.use('/pre-registrations', preRegistrationRouter)
router.use('/', partnerAccountRouter)
router.use('/internal', internalRouter)

export default router
