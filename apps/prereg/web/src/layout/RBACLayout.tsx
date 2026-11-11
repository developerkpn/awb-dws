import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/hooks/auth'
import { hasPermission } from '@/utils/permission'
import type { RBACLayoutProps } from '@/types/layout'

export default function RBACLayout({
  permission,
  adminOnly = false,
  allowedRoles,
  disallowedRoles,
}: RBACLayoutProps) {
  const { user } = useAuth()

  if (
    (permission && !hasPermission(user, permission)) ||
    (adminOnly && user?.role !== 'ADMIN') ||
    (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) ||
    (disallowedRoles && user?.role && disallowedRoles.includes(user.role))
  ) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
