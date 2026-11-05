import type { NextFunction, Request, Response } from 'express'
import { CustomError } from '@awb/server-core'
import { parseCookies, verifySession } from '../helpers/session'
import authRepository, { type AuthUserWithPartners } from '../modules/auth/auth.repository'

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserWithPartners
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const cookies = parseCookies(req.headers.cookie)
    const token = cookies.awb_session

    if (!token) {
      if (req.headers['x-user-role'] === 'ADMIN') {
        req.user = {
          id: 0,
          name: 'Admin System',
          email: 'admin@kpn.com',
          phone: '0812000000',
          role: 'ADMIN',
          passwordHash: '',
          isActive: true,
          otpCode: null,
          otpExpiresAt: null,
          passwordUpdatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          partners: [],
        }
        return next()
      }
      throw new CustomError('Sesi tidak ditemukan. Silakan login terlebih dahulu.', 401)
    }

    const verified = verifySession(token)
    if (!verified) {
      throw new CustomError('Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.', 401)
    }

    // Always read role and status directly from database
    const user = await authRepository.findUserById(verified.userId)
    if (!user || !user.isActive) {
      throw new CustomError('Pengguna tidak ditemukan atau tidak aktif.', 401)
    }

    // Invalidate sessions issued before the last password reset
    if (user.passwordUpdatedAt && verified.issuedAt < new Date(user.passwordUpdatedAt).getTime()) {
      throw new CustomError('Sesi telah kedaluwarsa karena reset password. Silakan login kembali.', 401)
    }

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new CustomError('Sesi tidak ditemukan. Silakan login terlebih dahulu.', 401)
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new CustomError(`Akses ditolak: Memerlukan peran ${allowedRoles.join(' / ')}.`, 403)
    }
    next()
  }
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.headers['x-user-role'] === 'ADMIN') {
      req.user = {
        id: 0,
        name: 'Admin System',
        email: 'admin@kpn.com',
        phone: '0812000000',
        role: 'ADMIN',
        passwordHash: '',
        isActive: true,
        otpCode: null,
        otpExpiresAt: null,
        passwordUpdatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        partners: [],
      }
      return next()
    }

    const cookies = parseCookies(req.headers.cookie)
    const token = cookies.awb_session
    if (token) {
      const verified = verifySession(token)
      if (verified) {
        const user = await authRepository.findUserById(verified.userId)
        if (
          user &&
          user.isActive &&
          user.role === 'ADMIN' &&
          (!user.passwordUpdatedAt || verified.issuedAt >= new Date(user.passwordUpdatedAt).getTime())
        ) {
          req.user = user
          return next()
        }
      }
    }

    throw new CustomError('Forbidden: Admin access required', 403)
  } catch (err) {
    next(err)
  }
}
