import { useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/hooks/auth'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import Navbar from '@/components/Navbar'
import SideBar from '@/components/SideBar'
import { getErrorMessage } from '@/utils/errorHandler'

export default function BaseLayout() {
  const { user, isLoading, error, refresh } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  if (isLoading) return <LoadingState message="Checking your session…" />
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refresh()} />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="awb-app">
      <Navbar onToggle={() => setCollapsed((value) => !value)} />
      <div className="awb-body">
        <SideBar collapsed={collapsed} />
        <main className="awb-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
