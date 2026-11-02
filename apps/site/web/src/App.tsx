import { AppShell } from '@awb/ui'
import { AdminPage } from './features/admin/AdminPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { TcsPage } from './features/tcs/TcsPage'
import { WeighbridgePage } from './features/weighbridge/WeighbridgePage'

export default function App() {
  return (
    <AppShell
      title="AWB Plant Console"
      pages={[
        { key: 'weighbridge', label: 'Timbangan', element: <WeighbridgePage /> },
        { key: 'tcs', label: 'TCS', element: <TcsPage /> },
        { key: 'dashboard', label: 'Dashboard', element: <DashboardPage /> },
        { key: 'admin', label: 'Admin', element: <AdminPage /> },
      ]}
    />
  )
}
