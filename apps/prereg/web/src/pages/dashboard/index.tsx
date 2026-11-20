import { Suspense, lazy } from 'react'
import { useAuth } from '@/hooks/auth'
import { PERMISSION } from '@/constant/PERMISSION'
import { hasPermission } from '@/utils/permission'

const RegistrationReport = lazy(() => import('./_components/RegistrationReport'))

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.name.split(' ')[0] ?? 'there'

  const day = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const canReadReport = hasPermission(user, PERMISSION.PREREG.READ)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-400">{day}</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Overview</h1>
          <p className="text-sm text-stone-500">
            Welcome back, {firstName}. Monitor and export registration activities.
          </p>
        </div>
      </div>

      {canReadReport && (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-5 flex items-center justify-between border-b border-stone-100 pb-4 dark:border-stone-800">
            <div>
              <h2 className="text-lg font-semibold text-ink" aria-label="Laporan registrasi">
                Registration report
              </h2>
              <p className="text-xs text-stone-400">
                Live truck registration allocations across JUL and BEL flows
              </p>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="h-96 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800" />
            }
          >
            <RegistrationReport />
          </Suspense>
        </div>
      )}
    </div>
  )
}
