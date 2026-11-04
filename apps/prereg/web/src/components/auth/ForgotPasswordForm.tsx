import type { FormEvent } from 'react'
import { AuthLayout, Button, Input } from '@awb/ui'

export type ForgotPasswordStep = 'REQUEST_OTP' | 'VERIFY_OTP' | 'SUCCESS'

export interface ForgotPasswordFormProps {
  step: ForgotPasswordStep
  identifier: string
  otp: string
  error?: string
  isLoading: boolean
  onIdentifierChange: (val: string) => void
  onOtpChange: (val: string) => void
  onRequestOtp: (e: FormEvent) => void
  onVerifyOtp: (e: FormEvent) => void
  onBackToLogin: () => void
  onResendOtp: () => void
}

export function ForgotPasswordForm({
  step,
  identifier,
  otp,
  error,
  isLoading,
  onIdentifierChange,
  onOtpChange,
  onRequestOtp,
  onVerifyOtp,
  onBackToLogin,
  onResendOtp,
}: ForgotPasswordFormProps) {
  return (
    <AuthLayout
      badge="AWB-DWS LOGISTICS"
      heroTitle="Secure Identity & Credentials Recovery"
      heroDescription="Automated OTP verification ensures that account resets are instant, safe, and delivered directly to your authorized email address."
      logo={
        <img
          src="/kpn-corp.png"
          alt="KPN Corp"
          style={{ height: '34px', objectFit: 'contain' }}
        />
      }
      title={
        step === 'REQUEST_OTP'
          ? 'Reset password'
          : step === 'VERIFY_OTP'
            ? 'Enter OTP Code'
            : 'Password Sent'
      }
      subtitle={
        step === 'REQUEST_OTP'
          ? 'Enter your username or email. We will send an OTP verification code to your registered email.'
          : step === 'VERIFY_OTP'
            ? `Please enter the 6-digit OTP code sent to your email address.`
            : undefined
      }
    >
      {error && (
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
          {error}
        </div>
      )}

      {step === 'REQUEST_OTP' && (
        <form onSubmit={onRequestOtp} noValidate>
          <Input
            label="Username or Email"
            type="text"
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value)}
            autoComplete="username"
            required
          />

          <div style={{ marginTop: '6px' }}>
            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Send OTP Code
            </Button>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#64748b',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              &larr; Back to Sign In
            </button>
          </div>
        </form>
      )}

      {step === 'VERIFY_OTP' && (
        <form onSubmit={onVerifyOtp} noValidate>
          <Input
            label="6-Digit OTP Code"
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => onOtpChange(e.target.value.replace(/[^0-9]/g, ''))}
            style={{
              letterSpacing: '0.3em',
              fontSize: '18px',
              textAlign: 'center',
              fontWeight: 700,
            }}
            required
          />

          <div style={{ marginTop: '6px' }}>
            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Verify &amp; Generate Password
            </Button>
          </div>

          <div
            style={{
              marginTop: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
            }}
          >
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              &larr; Cancel
            </button>

            <button
              type="button"
              onClick={onResendOtp}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#8b2424',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}

      {step === 'SUCCESS' && (
        <div>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              &#10003;
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#15803d', marginBottom: '4px' }}>
                Password Sent Successfully
              </div>
              <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                A new secure password has been generated by the system and sent to your email. Please check your inbox to sign in.
              </div>
              <div style={{ fontSize: '12px', color: '#4b7c59', marginTop: '6px' }}>
                All previous sessions have been invalidated for security.
              </div>
            </div>
          </div>

          <Button type="button" variant="primary" fullWidth onClick={onBackToLogin}>
            Back to Sign In
          </Button>
        </div>
      )}
    </AuthLayout>
  )
}
