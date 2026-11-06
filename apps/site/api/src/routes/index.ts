import { Router } from 'express'
import journeyRouter from '../modules/journey/journey.routes'
import registrationRouter from '../modules/registration/registration.routes'
import syncRouter from '../modules/sync/sync.routes'
import tcsRouter from '../modules/tcs/tcs.routes'
import weighbridgeRouter from '../modules/weighbridge/weighbridge.routes'

const router = Router()

router.use('/journeys', journeyRouter)
router.use('/registration', registrationRouter)
router.use('/weighbridge', weighbridgeRouter)
router.use('/tcs', tcsRouter)
router.use('/sync', syncRouter)

export default router
