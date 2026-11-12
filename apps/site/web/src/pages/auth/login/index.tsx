import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/auth'
import { LoginForm } from './_components/LoginForm'
import { getErrorMessage } from '@/utils/errorHandler'
import type { LoginFormData } from '@/types/auth'
import { ThemeControl } from '@awb/ui'
import { operatorLoginInput } from '@awb/contracts'

export default function Login() {
  const navigate = useNavigate()
  const { loginMutation } = useAuth()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(operatorLoginInput),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  })

  const submit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data)

      navigate('/registrations', { replace: true })
    } catch {
      return
    }
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 flex-col justify-between bg-brand-600 p-12 text-white">
        <img
          src="/plant-hero-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/45 to-black/35" />
        <div className="relative flex items-center gap-3">
          <img src="/kpn-corp.png" alt="KPN" className="h-8 brightness-0 invert" />
          <span className="border-l border-white/30 pl-3 text-sm font-semibold tracking-wide">
            AWB Plant Console
          </span>
        </div>
        <div className="relative space-y-4">
          <p className="text-xs font-semibold tracking-widest text-brand-200 uppercase">
            AWB-DWS Plant Operations
          </p>
          <h1 className="text-4xl font-bold leading-tight">
            Truck Registration &amp; Weighbridge Console
          </h1>
          <p className="text-brand-200 leading-relaxed">
            Register arriving trucks, run the weighbridge and control the plant gates in one place.
          </p>
        </div>
        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} KPN Corp. All rights reserved.
        </p>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="absolute right-6 top-6">
          <ThemeControl />
        </div>
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <img src="/kpn-corp.png" alt="KPN" className="h-7" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-ink">Sign in</h2>
            <p className="mt-1 text-sm text-stone-500">Enter your credentials to continue</p>
          </div>

          <LoginForm
            form={form}
            error={loginMutation.error ? getErrorMessage(loginMutation.error) : undefined}
            isLoading={loginMutation.isPending}
            onSubmit={submit}
            onForgotPassword={() => navigate('/forgot-password')}
          />
        </div>
      </div>
    </div>
  )
}
