import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env'

const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export function signSession(userId: number, timestamp = Date.now()): string {
  const payload = `${userId}.${timestamp}`
  const signature = createHmac('sha256', env.SESSION_SECRET).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifySession(token: string, maxAgeMs = DEFAULT_MAX_AGE_MS): { userId: number; issuedAt: number } | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [rawId, rawTimestamp, signature] = parts
  const userId = Number.parseInt(rawId!, 10)
  const timestamp = Number.parseInt(rawTimestamp!, 10)
  if (Number.isNaN(userId) || Number.isNaN(timestamp)) return null

  // Reject expired tokens
  if (Date.now() - timestamp > maxAgeMs) return null

  const expectedSignature = createHmac('sha256', env.SESSION_SECRET)
    .update(`${userId}.${timestamp}`)
    .digest('base64url')

  const sigBuf = Buffer.from(signature!, 'utf8')
  const expectedBuf = Buffer.from(expectedSignature, 'utf8')
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }

  return { userId, issuedAt: timestamp }
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('='))
      .filter((parts) => parts.length === 2)
      .map(([k, v]) => [k!.trim(), decodeURIComponent(v!.trim())]),
  )
}

export function serializeSessionCookie(token: string, maxAgeMs = DEFAULT_MAX_AGE_MS): string {
  const secure = env.NODE_ENV === 'production' ? '; Secure' : ''
  const maxAgeSec = Math.floor(maxAgeMs / 1000)
  return `awb_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`
}

export function clearSessionCookie(): string {
  return 'awb_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0'
}
