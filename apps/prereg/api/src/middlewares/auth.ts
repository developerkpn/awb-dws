import type { Request, RequestHandler } from 'express'
import { parseCookie, stringifySetCookie } from 'cookie'
import { CustomError } from '@awb/server-core'
import { env } from '../config/env'
import authService from '../modules/auth/auth.service'
import type { SessionUser } from '../modules/auth/auth.schema'

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: SessionUser
  }
}

export const SESSION_COOKIE = 'awb_session'
export const readToken = (req: Request) => parseCookie(req.headers.cookie ?? '')[SESSION_COOKIE]
export const sessionCookie = (token: string, expires?: Date) =>
  stringifySetCookie({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    ...(expires ? { expires } : {}),
  })

export const sameOrigin: RequestHandler = (req, _res, next) => {
  if (req.path === '/internal' || req.path.startsWith('/internal/')) {
    next()
    return
  }
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
  const user = token && /^[\w-]{43}$/.test(token) ? await authService.authenticate(token) : null
  if (!user) throw new CustomError('Sign in required', 401)
  req.authUser = user
  next()
}

export function currentUser(req: Request) {
  if (!req.authUser) throw new CustomError('Sign in required', 401)
  return req.authUser
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (currentUser(req).role !== 'ADMIN') throw new CustomError('ADMIN role required', 403)
  next()
}

export const requirePermission =
  (permission: string): RequestHandler =>
  (req, _res, next) => {
    const user = currentUser(req)
    if (user.role !== 'ADMIN' && !user.permissions.includes(permission))
      throw new CustomError('Access denied', 403)
    next()
  }
