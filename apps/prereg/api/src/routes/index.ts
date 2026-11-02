import { Router } from 'express'
import preRegistrationRouter from '../modules/pre-registration/pre-registration.routes'
import internalRouter from './internal'

const router = Router()

router.use('/pre-registrations', preRegistrationRouter)
router.use('/internal', internalRouter)

export default router
