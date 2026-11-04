import type { ReactNode } from 'react'

export interface AuthLayoutProps {
  badge?: string
  heroTitle?: string
  heroDescription?: string
  heroBackgroundImage?: string
  logo?: ReactNode
  title: string
  subtitle?: string
  children: ReactNode
}

export function AuthLayout({
  badge = 'AWB-DWS LOGISTICS',
  heroTitle = 'Automated Weighbridge & Gate Access Control',
  heroDescription = 'Manage supplier arrivals, digital pre-registration queues, and fast-track weighbridge ticketing across all KPN plant locations.',
  heroBackgroundImage = '/auth-hero-bg.jpg',
  logo,
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#0f172a',
        overflow: 'hidden',
      }}
    >
      {/* Left / Hero Side */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 48px',
          position: 'relative',
          backgroundColor: '#090d16',
          color: '#ffffff',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
        className="auth-hero-pane"
      >
        {/* Photographic Hero Background with Dark Vignette */}
        {heroBackgroundImage && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${heroBackgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.46,
              filter: 'brightness(0.9) contrast(1.15)',
              zIndex: 0,
            }}
          />
        )}

        {/* Gradient Overlay to blend seamlessly with dark slate typography */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(9, 13, 22, 0.75) 0%, rgba(9, 13, 22, 0.5) 45%, rgba(9, 13, 22, 0.88) 100%)',
            zIndex: 0,
          }}
        />

        {/* Subtle Ambient Radial Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 36, 36, 0.28) 0%, rgba(139, 36, 36, 0) 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0) 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />



        {/* Top Header on Hero */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: '#f8fafc',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            {badge}
          </span>
        </div>

        {/* Middle Value Proposition */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px', margin: '32px 0' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              lineHeight: 1.25,
              margin: '0 0 16px',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            {heroTitle}
          </h2>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.55,
              color: '#94a3b8',
              margin: '0 0 28px',
            }}
          >
            {heroDescription}
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>2-Tap RFID</div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Automated Weighing</div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>AI & OCR</div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>License Plate Verification</div>
            </div>
          </div>
        </div>

        {/* Bottom Hero Info */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: '12.5px', color: '#64748b' }}>
          &copy; {new Date().getFullYear()} KPN Corp Downstream. All rights reserved.
        </div>
      </div>

      {/* Right Side: Clean Auth Form Pane */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 32px',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          overflowY: 'auto',
          height: '100%',
        }}
      >
        <div style={{ width: '100%', maxWidth: '410px', boxSizing: 'border-box' }}>
          {/* Logo & Heading */}
          <div style={{ marginBottom: subtitle ? '24px' : '20px' }}>
            {logo && <div style={{ marginBottom: '16px' }}>{logo}</div>}
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: '6px 0 0',
                  lineHeight: 1.45,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .auth-hero-pane {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
