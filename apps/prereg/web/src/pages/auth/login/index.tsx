import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/auth'
import { LoginForm } from '@/pages/auth/login/_components/LoginForm'
import { getErrorMessage } from '@/utils/errorHandler'
import type { LoginFormData } from '@/types/auth'
import { loginSchema } from './schema'

export default function Login() {
  const navigate = useNavigate()
  const { loginMutation } = useAuth()
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', rememberMe: false },
  })

  const submit = async (data: LoginFormData) => {
    try {
      const response = await loginMutation.mutateAsync(data)
      navigate(response.user.role === 'ADMIN' ? '/users' : '/', { replace: true })
    } catch {
      // Server errors are displayed by the form.
    }
  }

  return (
    <LoginForm
      form={form}
      error={loginMutation.error ? getErrorMessage(loginMutation.error) : undefined}
      isLoading={loginMutation.isPending}
      onSubmit={submit}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  )
}
