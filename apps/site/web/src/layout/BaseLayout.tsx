import { Suspense, useEffect, useState } from 'react'
import { useMediaQuery } from '@awb/ui'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/hooks/auth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import LoadingState from '@/components/LoadingState'
import { Button } from '@/ui/Button'
import { AlertTriangle } from '@/ui/icons'
import { getErrorMessage } from '@/utils/errorHandler'
import SideBar from '@/components/SideBar'
import Topbar from '@/components/Navbar'

const PAGE_TITLES: Record<string, string> = {
  '/registrations/new': 'New registration',
  '/registrations': 'Truck registrations',
  '/masters': 'Data master',
  '/weighbridge': 'Weighbridge',
  '/tcs': 'TCS',
  '/dashboard': 'Dashboard',
  '/admin': 'Admin',
}

function usePageTitle() {
  const { pathname } = useLocation()

  // exact match first, then prefix
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]

  const prefix = Object.keys(PAGE_TITLES)
    .filter((k) => k !== '/' && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]

  return prefix ? (PAGE_TITLES[prefix] ?? '') : ''
}

export default function BaseLayout() {
  const { user, isLoading, error, refresh } = useAuth()
  const narrow = useMediaQuery('(max-width: 767px)')
  const [collapsed, setCollapsed] = useState(narrow)

  useEffect(() => setCollapsed(narrow), [narrow])
  const title = usePageTitle()

  useDocumentTitle(title)

  if (isLoading) return <LoadingState shell />

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <AlertTriangle className="size-10 text-brand-600" />
          <p className="text-sm text-stone-700">{getErrorMessage(error)}</p>
          <Button onClick={() => void refresh()}>Try again</Button>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f4f5f7]">
      <SideBar collapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          title={title}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />

        <main className="mr-2 mb-2 flex-1 overflow-y-auto rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs sm:mr-4 sm:mb-4 sm:p-8">
          <div className="mx-auto max-w-[1440px] space-y-6">
            <Suspense fallback={<LoadingState />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
