import { Input } from '@/ui/Field'
import { Button } from '@/ui/Button'
import { FormError } from '@/ui/Field'
import type { LoginFormProps } from '@/types/auth'

export function LoginForm({ form, error, isLoading, onSubmit, onForgotPassword }: LoginFormProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormError message={error} />

      <Input
        aria-label="Username"
        placeholder="Username"
        autoComplete="username"
        required
        {...form.register('username')}
        disabled={isLoading}
      />
      {form.formState.errors.username && (
        <p className="text-xs text-brand-700">{form.formState.errors.username.message}</p>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-stone-700">
            Password
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs font-medium text-brand-700 hover:text-brand-800"
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          {...form.register('password')}
          disabled={isLoading}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-brand-700">{form.formState.errors.password.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2.5 text-sm text-stone-600">
        <input
          type="checkbox"
          {...form.register('rememberMe')}
          disabled={isLoading}
          className="size-4 rounded border-stone-300 accent-brand-600"
        />
        Remember me on this device
      </label>

      <Button type="submit" isLoading={isLoading} className="w-full">
        Sign in
      </Button>
    </form>
  )
}
