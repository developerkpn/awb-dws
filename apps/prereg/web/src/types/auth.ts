import type { UseFormReturn } from 'react-hook-form'
import type { SessionUser } from '@awb/contracts'

export type AuthUser = SessionUser

export interface AuthResponse {
  user: AuthUser
}

export interface LoginFormData {
  username: string
  password: string
  rememberMe: boolean
}

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
