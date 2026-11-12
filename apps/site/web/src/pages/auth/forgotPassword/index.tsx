import { useNavigate } from 'react-router'
import { Button } from '@/ui/Button'
import { ArrowLeft, Mail } from '@/ui/icons'

export default function ForgotPassword() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Mail className="size-7" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-ink">Password recovery</h2>
          <p className="mt-2 text-sm text-stone-500">
            Self-service password recovery is not yet available. Please ask your plant administrator
            to reset your password.
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<ArrowLeft className="size-4" />}
          onClick={() => navigate('/login')}
          className="w-full"
        >
          Back to sign in
        </Button>
      </div>
    </div>
  )
}
