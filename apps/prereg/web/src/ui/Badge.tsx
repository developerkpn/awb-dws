import type { ReactNode } from 'react'

type Variant =
  | 'default'
  | 'active'
  | 'inactive'
  | 'internal'
  | 'partner'
  | 'admin'
  | 'info'
  | 'warning'
  | 'danger'

const styles: Record<Variant, string> = {
  default: 'bg-stone-100 text-stone-700',
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  inactive: 'bg-stone-100 text-stone-500',
  internal: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  partner: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  admin: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
