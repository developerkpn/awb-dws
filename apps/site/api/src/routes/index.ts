import { Router } from 'express'
import { journeyRouter } from '../domains/journey'
import { registrationRouter } from '../domains/registration'
import { syncRouter } from '../domains/sync'
import { tcsRouter } from '../domains/tcs'
import { weighbridgeRouter } from '../domains/weighbridge'

const router = Router()

router.use('/journeys', journeyRouter)
router.use('/registration', registrationRouter)
router.use('/weighbridge', weighbridgeRouter)
router.use('/tcs', tcsRouter)
router.use('/sync', syncRouter)

export default router
