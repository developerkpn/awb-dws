import { useState, type FormEvent } from 'react'
import {
  LoginForm,
  type LoginFormErrors,
  type LoginFormValues,
} from '../../components/auth/LoginForm'

export interface LoginPageProps {
  onSuccess?: (user: { name: string; username: string; role: string }) => void
  onForgotPassword?: () => void
}

export default function LoginPage({
  onSuccess,
  onForgotPassword = () => {},
}: LoginPageProps) {
  const [values, setValues] = useState<LoginFormValues>({
    username: '',
    password: '',
    rememberMe: true,
  })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: keyof LoginFormValues, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (field in errors && errors[field as keyof LoginFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: LoginFormErrors = {}

    if (!values.username.trim()) {
      newErrors.username = 'Username or email address is required'
    }

    if (!values.password) {
      newErrors.password = 'Password is required'
    } else if (values.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)
    setErrors({})

    try {
      // Simulated authentication delay
      await new Promise((resolve) => setTimeout(resolve, 600))

      // Determine mock role based on username or default to CUSTOMER
      const lower = values.username.toLowerCase()
      const role = lower.includes('admin')
        ? 'ADMIN'
        : lower.includes('vendor')
          ? 'VENDOR'
          : lower.includes('logistic')
            ? 'LOGISTIC'
            : 'CUSTOMER'

      const displayName = values.username.split('@')[0] || values.username

      if (onSuccess) {
        onSuccess({
          name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          username: values.username,
          role,
        })
      }
    } catch {
      setErrors({ general: 'Invalid credentials or connection error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LoginForm
      values={values}
      errors={errors}
      isLoading={isLoading}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onForgotPassword={onForgotPassword}
    />
  )
}
