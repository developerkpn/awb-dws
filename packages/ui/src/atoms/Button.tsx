import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Skeleton } from './Skeleton'
import '../styles/components.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  fullWidth?: boolean
  isLoading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  type = 'button',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      data-variant={variant}
      data-size={size}
      data-full-width={fullWidth || undefined}
      className={`ui-button ${className}`}
    >
      <span className="ui-button-content" data-loading={isLoading}>
        {icon}
        {children}
      </span>
      {isLoading && <Skeleton className="ui-button-skeleton" />}
    </button>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}
export function IconButton({ label, children, ...props }: IconButtonProps) {
  return (
    <Button variant="ghost" size="icon" title={label} aria-label={label} {...props}>
      {children}
    </Button>
  )
}
