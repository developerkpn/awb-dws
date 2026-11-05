import { useNavigate } from 'react-router'
import { AuthLayout, Button } from '@awb/ui'

export default function ForgotPassword() {
  const navigate = useNavigate()

  return (
    <AuthLayout
      badge="AWB-DWS LOGISTICS"
      heroTitle="Account support"
      heroDescription="Contact your administrator for assistance with access to the portal."
      title="Password recovery is unavailable"
    >
      <p>Self-service password recovery is being prepared. Contact your administrator for help.</p>
      <Button onClick={() => navigate('/login')} fullWidth>
        Back to sign in
      </Button>
    </AuthLayout>
  )
}
