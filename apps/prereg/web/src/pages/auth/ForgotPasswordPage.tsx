import { useState, type FormEvent } from 'react'
import {
  ForgotPasswordForm,
  type ForgotPasswordStep,
} from '../../components/auth/ForgotPasswordForm'

export interface ForgotPasswordPageProps {
  onBackToLogin: () => void
}

export default function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<ForgotPasswordStep>('REQUEST_OTP')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault()

    if (!identifier.trim()) {
      setError('Please enter your username or registered email')
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      // Simulated OTP dispatch API
      await new Promise((resolve) => setTimeout(resolve, 600))
      setStep('VERIFY_OTP')
    } catch {
      setError('Failed to send OTP code. Please verify your username/email.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()

    if (!otp.trim() || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP code')
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      // Simulated OTP verification & password generation API
      await new Promise((resolve) => setTimeout(resolve, 700))
      setStep('SUCCESS')
    } catch {
      setError('Invalid or expired OTP code. Please try again or request a new code.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setError(undefined)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      alert(`A new OTP verification code has been dispatched to ${identifier}.`)
    } catch {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ForgotPasswordForm
      step={step}
      identifier={identifier}
      otp={otp}
      error={error}
      isLoading={isLoading}
      onIdentifierChange={(val) => {
        setIdentifier(val)
        setError(undefined)
      }}
      onOtpChange={(val) => {
        setOtp(val)
        setError(undefined)
      }}
      onRequestOtp={handleRequestOtp}
      onVerifyOtp={handleVerifyOtp}
      onBackToLogin={onBackToLogin}
      onResendOtp={handleResendOtp}
    />
  )
}
