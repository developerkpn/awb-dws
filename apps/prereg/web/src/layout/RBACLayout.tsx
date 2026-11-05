import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/hooks/auth'
import { hasPermission } from '@/utils/permission'

interface RBACLayoutProps {
  permission: string
  adminOnly?: boolean
}

export default function RBACLayout({ permission, adminOnly = false }: RBACLayoutProps) {
  const { user } = useAuth()

  if (!hasPermission(user, permission) || (adminOnly && user?.role !== 'ADMIN')) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
