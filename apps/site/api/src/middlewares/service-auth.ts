import { createHash, timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'
import { CustomError } from '@awb/server-core'
import { env } from '../config/env'

export const requireServiceAuth: RequestHandler = (req, _res, next) => {
  const provided = req.get('x-service-key')

  if (
    !provided ||
    !timingSafeEqual(
      createHash('sha256').update(provided).digest(),
      createHash('sha256').update(env.INTERNAL_SERVICE_KEY).digest(),
    )
  )
    throw new CustomError('Unauthorized service request', 401)

  next()
}
