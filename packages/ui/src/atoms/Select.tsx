import type { ComponentPropsWithRef } from 'react'
import '../styles/forms.css'

export function Select({ className = '', ...props }: ComponentPropsWithRef<'select'>) {
  return (
    <div className={`ui-select-wrap ${className}`}>
      <select {...props} className="ui-input ui-select" />
    </div>
  )
}
