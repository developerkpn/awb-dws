import { CustomError } from '@awb/server-core'

type AttemptRecord = {
  count: number
  firstAttemptAt: number
  blockedUntil?: number
}

const attempts = new Map<string, AttemptRecord>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const BLOCK_DURATION_MS = 15 * 60 * 1000

export function checkLoginRateLimit(key: string): void {
  const record = attempts.get(key)
  if (!record) return

  const now = Date.now()
  if (record.blockedUntil && record.blockedUntil > now) {
    const remainingSec = Math.ceil((record.blockedUntil - now) / 1000)
    throw new CustomError(`Terlalu banyak percobaan login. Silakan coba lagi dalam ${remainingSec} detik.`, 429)
  }

  // Reset window if expired
  if (now - record.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key)
  }
}

export function recordFailedLogin(key: string): void {
  const now = Date.now()
  const record = attempts.get(key)

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now })
    return
  }

  record.count += 1
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS
  }
}

export function resetLoginAttempts(key: string): void {
  attempts.delete(key)
}

export function clearAllRateLimits(): void {
  attempts.clear()
}

