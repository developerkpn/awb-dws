import type { UseFormReturn } from 'react-hook-form'
import type { OperatorLoginInput, OperatorSession } from '@awb/contracts'

export type AuthUser = OperatorSession

export interface AuthResponse {
  user: AuthUser
}

export type LoginFormData = OperatorLoginInput

export interface AuthQueryOptions {
  poll?: boolean
}

export interface LoginFormProps {
  form: UseFormReturn<LoginFormData>
  error?: string
  isLoading: boolean
  onSubmit: (data: LoginFormData) => Promise<void>
  onForgotPassword: () => void
}
