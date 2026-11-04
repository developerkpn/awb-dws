import type { FormEvent } from 'react'
import { AuthLayout, Button, Input } from '@awb/ui'

export interface LoginFormValues {
  username: string
  password: string
  rememberMe: boolean
}

export interface LoginFormErrors {
  username?: string
  password?: string
  general?: string
}

export interface LoginFormProps {
  values: LoginFormValues
  errors: LoginFormErrors
  isLoading: boolean
  onChange: (field: keyof LoginFormValues, value: any) => void
  onSubmit: (e: FormEvent) => void
  onForgotPassword: () => void
}

export function LoginForm({
  values,
  errors,
  isLoading,
  onChange,
  onSubmit,
  onForgotPassword,
}: LoginFormProps) {
  return (
    <AuthLayout
      badge="AWB-DWS LOGISTICS"
      heroTitle="Automated Weighbridge & Gate Access Control"
      heroDescription="Manage supplier arrivals, digital pre-registration queues, and fast-track weighbridge ticketing across all KPN plant locations."
      logo={
        <img
          src="/kpn-corp.png"
          alt="KPN Corp"
          style={{ height: '34px', objectFit: 'contain' }}
        />
      }
      title="Sign in"
    >
      <form onSubmit={onSubmit} noValidate>
        {errors.general && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '9px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '16px',
              lineHeight: 1.4,
            }}
          >
            {errors.general}
          </div>
        )}

        <Input
          label="Email or Username"
          type="text"
          name="username"
          value={values.username}
          error={errors.username}
          onChange={(e) => onChange('username', e.target.value)}
          autoComplete="username"
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={values.password}
          error={errors.password}
          onChange={(e) => onChange('password', e.target.value)}
          autoComplete="current-password"
          rightLabelAction={
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '12.5px',
                color: '#8b2424',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Forgot password?
            </button>
          }
          required
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#475569',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={values.rememberMe}
              onChange={(e) => onChange('rememberMe', e.target.checked)}
              style={{
                width: '15px',
                height: '15px',
                accentColor: '#8b2424',
                cursor: 'pointer',
              }}
            />
            Remember me on this device
          </label>
        </div>

        <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
          Sign In
        </Button>
      </form>
    </AuthLayout>
  )
}
