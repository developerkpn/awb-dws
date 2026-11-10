import { Navigate, Outlet, useLocation } from 'react-router'
import { Suspense } from 'react'
import { useAuth } from '@/hooks/auth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import { getErrorMessage } from '@/utils/errorHandler'

export default function AuthLayout() {
  const { user, isLoading, error, refresh } = useAuth()
  const { pathname } = useLocation()

  useDocumentTitle(pathname === '/forgot-password' ? 'Reset password' : 'Sign in')

  if (isLoading) return <LoadingState message="Checking your session…" />

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refresh()} />

  if (user) return <Navigate to={user.role === 'ADMIN' ? '/users' : '/'} replace />

  return (
    <Suspense fallback={<LoadingState />}>
      <Outlet />
    </Suspense>
  )
}
