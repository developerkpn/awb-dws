import { Router } from 'express'
import { sameOrigin } from '../middlewares/auth'
import authRouter from '../modules/auth/auth.routes'
import journeyRouter from '../modules/journey/journey.routes'
import masterRouter from '../modules/master/master.routes'
import registrationRouter from '../modules/registration/registration.routes'
import syncRouter from '../modules/sync/sync.routes'
import tcsRouter from '../modules/tcs/tcs.routes'
import weighbridgeRouter from '../modules/weighbridge/weighbridge.routes'

const router = Router()

router.use('/journeys', journeyRouter)
router.use('/auth', sameOrigin, authRouter)
router.use('/registrations', sameOrigin, registrationRouter)
router.use('/masters', sameOrigin, masterRouter)
router.use('/weighbridge', weighbridgeRouter)
router.use('/tcs', tcsRouter)
router.use('/sync', syncRouter)

export default router
