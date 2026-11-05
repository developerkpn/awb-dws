import type { AuthUser } from '@/types/auth'

export function hasPermission(user: AuthUser | null | undefined, permission: string) {
  return !!user && (user.role === 'ADMIN' || user.permissions.includes(permission))
}
