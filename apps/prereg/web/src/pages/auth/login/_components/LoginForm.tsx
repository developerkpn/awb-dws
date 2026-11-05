import type { UseFormReturn } from 'react-hook-form'
import { AuthLayout, Button, Input } from '@awb/ui'
import type { LoginFormData } from '@/types/auth'

interface LoginFormProps {
  form: UseFormReturn<LoginFormData>
  error?: string
  isLoading: boolean
  onSubmit: (data: LoginFormData) => Promise<void>
  onForgotPassword: () => void
}

export function LoginForm({ form, error, isLoading, onSubmit, onForgotPassword }: LoginFormProps) {
  return (
    <AuthLayout
      badge="AWB-DWS LOGISTICS"
      heroTitle="Automated Weighbridge & Gate Access Control"
      heroDescription="Manage supplier arrivals, digital pre-registration queues, and weighbridge ticketing."
      logo={<img src="/kpn-corp.png" alt="KPN" style={{ height: '34px', objectFit: 'contain' }} />}
      title="Sign in"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {error && (
          <p className="awb-error" role="alert">
            {error}
          </p>
        )}
        <Input
          label="Username"
          autoComplete="username"
          required
          {...form.register('username')}
          error={form.formState.errors.username?.message}
          disabled={isLoading}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          {...form.register('password')}
          error={form.formState.errors.password?.message}
          disabled={isLoading}
          rightLabelAction={
            <button className="awb-text-button" type="button" onClick={onForgotPassword}>
              Forgot password?
            </button>
          }
        />
        <label className="awb-remember">
          <input type="checkbox" {...form.register('rememberMe')} disabled={isLoading} />
          Remember me on this device
        </label>
        <Button type="submit" fullWidth isLoading={isLoading}>
          Sign In
        </Button>
      </form>
    </AuthLayout>
  )
}
