import { AppShell } from '@awb/ui'
import { ExitScreen } from './features/exit/ExitScreen'
import { RegistrationScreen } from './features/registration/RegistrationScreen'
import { WeighingScreen } from './features/weighing/WeighingScreen'

// Display only: card taps, sensors and controllers are handled by site-api, which pushes lane state here.
export default function App() {
  return (
    <AppShell
      title="AWB Kiosk"
      pages={[
        { key: 'registration', label: 'Registrasi', element: <RegistrationScreen /> },
        { key: 'weighing', label: 'Timbang', element: <WeighingScreen /> },
        { key: 'exit', label: 'Keluar', element: <ExitScreen /> },
      ]}
    />
  )
}
