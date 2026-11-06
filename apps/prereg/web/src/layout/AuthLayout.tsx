import { Navigate, Outlet } from 'react-router'
import { Suspense } from 'react'
import { useAuth } from '@/hooks/auth'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import { getErrorMessage } from '@/utils/errorHandler'

export default function AuthLayout() {
  const { user, isLoading, error, refresh } = useAuth()

  if (isLoading) return <LoadingState message="Checking your session…" />
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refresh()} />
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/users' : '/'} replace />

  return (
    <Suspense fallback={<LoadingState />}>
      <Outlet />
    </Suspense>
  )
}
