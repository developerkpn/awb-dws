import { AppShell } from '@awb/ui'
import AdminPage from '@/pages/admin'
import DashboardPage from '@/pages/dashboard'
import TcsPage from '@/pages/tcs/listTcs'
import WeighbridgePage from '@/pages/weighbridge/listWeighbridge'

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
