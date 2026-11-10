import type { ComponentPropsWithRef, ReactNode } from 'react'
import '../styles/forms.css'

export type InputProps = ComponentPropsWithRef<'input'> & { leadingIcon?: ReactNode }
export function Input({ className = '', leadingIcon, ...props }: InputProps) {
  const input = <input {...props} className={`ui-input ${className}`} />

  if (!leadingIcon) return input

  return (
    <div className="ui-input-with-icon">
      <span aria-hidden="true">{leadingIcon}</span>
      {input}
    </div>
  )
}
export function Textarea({ className = '', ...props }: ComponentPropsWithRef<'textarea'>) {
  return <textarea {...props} className={`ui-input ui-textarea ${className}`} />
}
