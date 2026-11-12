import type { Request, RequestHandler } from 'express'
import { parseCookie, stringifySetCookie } from 'cookie'
import { CustomError } from '@awb/server-core'
import type { OperatorSession } from '@awb/contracts'
import { env } from '../config/env'
import authService from '../modules/auth/auth.service'

declare module 'express-serve-static-core' {
  interface Request {
    operator?: OperatorSession
  }
}

export const SESSION_COOKIE = 'awb_site_session'

export const readToken = (req: Request) => {
  const token = parseCookie(req.headers.cookie ?? '')[SESSION_COOKIE]

  return token && /^[\w-]{43}$/.test(token) ? token : null
}

export const sessionCookie = (token: string, expires?: Date) =>
  stringifySetCookie({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: env.APP_ORIGIN.startsWith('https://'),
    sameSite: 'lax',
    path: '/api',
    ...(expires ? { expires } : {}),
  })

/** Cookie-authenticated writes must come from the plant console itself. */
export const sameOrigin: RequestHandler = (req, _res, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.headers.origin !== new URL(env.APP_ORIGIN).origin
  ) {
    throw new CustomError('Request origin is not allowed', 403)
  }

  next()
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = readToken(req)
  const operator = token ? await authService.authenticate(token) : null

  if (!operator) throw new CustomError('Sign in required', 401)

  req.operator = operator
  next()
}

export function currentOperator(req: Request) {
  if (!req.operator) throw new CustomError('Sign in required', 401)

  return req.operator
}
