import { cloneElement, isValidElement, useId, type ReactNode, type ReactElement } from 'react'
import '../styles/forms.css'
interface ControlProps {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}
export interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string | null
  children: ReactNode
  htmlFor?: string
  required?: boolean
}
export function Field({ label, hint, error, children, htmlFor, required }: FieldProps) {
  const generatedId = useId()
  const id = htmlFor ?? generatedId
  const messageId = `${id}-message`
  return (
    <div className="ui-field">
      <label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="ui-required">
            {' '}
            *
          </span>
        )}
      </label>
      {isValidElement<ControlProps>(children)
        ? cloneElement(children as ReactElement<ControlProps>, {
            id,
            'aria-invalid': !!error,
            'aria-required': required,
            'aria-describedby':
              [children.props['aria-describedby'], error || hint ? messageId : '']
                .filter(Boolean)
                .join(' ') || undefined,
          })
        : children}
      {(error || hint) && (
        <p
          id={messageId}
          className={error ? 'ui-field-error' : 'ui-field-hint'}
          role={error ? 'alert' : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
export function FormError({ message }: { message?: string | null }) {
  return message ? (
    <p role="alert" className="ui-form-error">
      {message}
    </p>
  ) : null
}
export function FormSuccess({ message }: { message?: string | null }) {
  return message ? (
    <p role="status" className="ui-form-success">
      {message}
    </p>
  ) : null
}
