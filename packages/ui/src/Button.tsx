import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  fullWidth?: boolean
  isLoading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isActive, setIsActive] = useState(false)

  const isActuallyDisabled = disabled || isLoading

  // KPN Deep Crimson Maroon Palette
  const primaryBg = isActive ? '#6e1a1a' : isHovered ? '#7b1f1f' : '#8b2424'

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    height: '44px',
    padding: '0 20px',
    fontSize: '14.5px',
    fontWeight: 600,
    borderRadius: '10px',
    border: 'none',
    cursor: isActuallyDisabled ? 'not-allowed' : 'pointer',
    opacity: isActuallyDisabled ? 0.6 : 1,
    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
    boxShadow:
      variant === 'primary' && !isActuallyDisabled
        ? isHovered
          ? '0 6px 16px rgba(139, 36, 36, 0.32)'
          : '0 2px 8px rgba(139, 36, 36, 0.2)'
        : 'none',
    ...style,
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: primaryBg,
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: isHovered ? '#e2e8f0' : '#f1f5f9',
      color: '#0f172a',
    },
    outline: {
      backgroundColor: isHovered ? '#fef2f2' : 'transparent',
      color: '#8b2424',
      border: '1.5px solid #8b2424',
    },
  }

  return (
    <button
      {...props}
      disabled={isActuallyDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsActive(false)
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {isLoading ? (
        <>
          <span
            style={{
              width: '15px',
              height: '15px',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'ui-btn-spin 0.7s linear infinite',
            }}
          />
          <style>{`@keyframes ui-btn-spin { to { transform: rotate(360deg); } }`}</style>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
