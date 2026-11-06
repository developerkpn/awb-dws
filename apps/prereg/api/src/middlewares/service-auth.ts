import type { RequestHandler } from 'express'
import { CustomError } from '@awb/server-core'
import { env } from '../config/env'
import { createHash, timingSafeEqual } from 'node:crypto'

declare module 'express-serve-static-core' {
  interface Request {
    serviceSiteId?: string
  }
}

const matches = (provided: string, expected: string) =>
  timingSafeEqual(
    createHash('sha256').update(provided).digest(),
    createHash('sha256').update(expected).digest(),
  )

export const requireServiceAuth: RequestHandler = (req, _res, next) => {
  const headerKey = req.headers['x-service-key']
  const authHeader = req.headers.authorization
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  const providedKey = typeof headerKey === 'string' ? headerKey : bearerKey

  if (!providedKey) {
    throw new CustomError('Unauthorized internal service request', 401)
  }

  const site = Object.entries(env.INTERNAL_SERVICE_KEYS).find(([, key]) =>
    matches(providedKey, key),
  )
  if (site) req.serviceSiteId = site[0]
  else if (env.NODE_ENV === 'production' || !matches(providedKey, env.INTERNAL_SERVICE_KEY)) {
    throw new CustomError('Unauthorized internal service request', 401)
  }

  next()
}
