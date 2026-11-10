import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcrypt'
import { CustomError } from '@awb/server-core'
import { env } from '../config/env'

export function validatePassword(password: string) {
  if (!password || Buffer.byteLength(password, 'utf8') > 72) {
    throw new CustomError('Password must contain between 1 and 72 UTF-8 bytes', 422)
  }
}

export async function hashPassword(password: string) {
  validatePassword(password)

  return bcrypt.hash(password, env.BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string) {
  validatePassword(password)

  if (/^\$2[aby]\$/.test(hash)) return bcrypt.compare(password, hash)

  if (env.ALLOW_LEGACY_PASSWORDS === 'true' && /^[a-f0-9]{64}$/.test(hash)) {
    return timingSafeEqual(createHash('sha256').update(password).digest(), Buffer.from(hash, 'hex'))
  }

  return false
}

export const generatePassword = () => randomBytes(24).toString('base64url')
