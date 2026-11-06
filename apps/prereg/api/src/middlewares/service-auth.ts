import type { RequestHandler } from 'express'
import { CustomError } from '@awb/server-core'
import { env } from '../config/env'

export const requireServiceAuth: RequestHandler = (req, _res, next) => {
  const headerKey = req.headers['x-service-key']
  const authHeader = req.headers.authorization
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  const providedKey = typeof headerKey === 'string' ? headerKey : bearerKey

  if (!providedKey || providedKey !== env.INTERNAL_SERVICE_KEY) {
    throw new CustomError('Unauthorized internal service request', 401)
  }

  next()
}
