import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  rightLabelAction?: ReactNode
}

export function Input({
  label,
  error,
  helperText,
  rightLabelAction,
  id,
  disabled,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const inputId = id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined)

  const borderColor = error
    ? '#ef4444'
    : isFocused
      ? '#8b2424'
      : '#cbd5e1'

  const focusRing = error
    ? '0 0 0 3px rgba(239, 68, 68, 0.12)'
    : isFocused
      ? '0 0 0 3.5px rgba(139, 36, 36, 0.1)'
      : 'none'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', marginBottom: '13px' }}>
      {(label || rightLabelAction) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && (
            <label
              htmlFor={inputId}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                letterSpacing: '-0.01em',
              }}
            >
              {label}
            </label>
          )}
          {rightLabelAction}
        </div>
      )}

      <input
        {...props}
        id={inputId}
        disabled={disabled}
        onFocus={(e) => {
          setIsFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          onBlur?.(e)
        }}
        style={{
          width: '100%',
          height: '42px',
          padding: '0 13px',
          fontSize: '14px',
          borderRadius: '9px',
          border: `1.5px solid ${borderColor}`,
          outline: 'none',
          boxShadow: focusRing,
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          color: '#0f172a',
          transition: 'border-color 0.16s ease, box-shadow 0.16s ease',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          ...style,
        }}
      />

      {error ? (
        <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  )
}
