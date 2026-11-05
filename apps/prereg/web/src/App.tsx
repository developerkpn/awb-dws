import { AppShell } from '@awb/ui'
import { ApprovalPage } from './features/approval/ApprovalPage'
import { HoRegistrationPage } from './features/ho-registration/HoRegistrationPage'
import { PartnerManagementPage } from './features/partner-management/PartnerManagementPage'
import { PreRegistrationPage } from './features/pre-registration/PreRegistrationPage'

export default function App() {
  return (
    <AppShell
      title="AWB Customer Pre-Registration"
      pages={[
        { key: 'pre-registration', label: 'Pre-Registration', element: <PreRegistrationPage /> },
        { key: 'partner-management', label: 'Akun Mitra (Admin)', element: <PartnerManagementPage /> },
        { key: 'approval', label: 'Approval HO', element: <ApprovalPage /> },
        { key: 'ho-registration', label: 'Registrasi HO', element: <HoRegistrationPage /> },
      ]}
    />
  )
}
