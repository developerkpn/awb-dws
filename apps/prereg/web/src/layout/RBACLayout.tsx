import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/hooks/auth'
import { hasPermission } from '@/utils/permission'
import type { RBACLayoutProps } from '@/types/layout'

export default function RBACLayout({ permission, adminOnly = false }: RBACLayoutProps) {
  const { user } = useAuth()

  if ((permission && !hasPermission(user, permission)) || (adminOnly && user?.role !== 'ADMIN')) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
