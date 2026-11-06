import type { ComponentPropsWithoutRef } from 'react'
import '../styles/skeleton.css'

export function Skeleton({ className = '', ...props }: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      {...props}
      aria-hidden="true"
      data-slot="skeleton"
      className={`ui-skeleton ${className}`}
    />
  )
}
