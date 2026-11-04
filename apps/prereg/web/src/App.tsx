import { useState, lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))

export interface AuthUser {
  name: string
  username: string
  role: string
}

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'forgot-password'>('login')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  // Protected route simulation: if user is not authenticated, redirect to login
  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentView('login')
  }

  return (
    <Suspense
      fallback={
        <div
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#090d16',
            color: '#f8fafc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                border: '3px solid rgba(255, 255, 255, 0.15)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'auth-spin 0.8s linear infinite',
                marginBottom: '12px',
              }}
            />
            <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>Loading AWB Portal...</div>
          </div>
        </div>
      }
    >
      {currentUser ? (
        // Authenticated Area with Header (Checklist item #3 & #4)
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Header displaying Name, Role, and Logout button */}
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              padding: '16px 32px',
              borderBottom: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src="/kpn-corp.png"
                alt="KPN Logo"
                style={{ height: '32px', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                AWB Customer Pre-Registration
              </span>
            </div>

            {/* User Profile & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {currentUser.username}
                  </div>
                </div>

                {/* Role Badge */}
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    backgroundColor:
                      currentUser.role === 'ADMIN'
                        ? '#fef2f2'
                        : currentUser.role === 'LOGISTIC'
                          ? '#eff6ff'
                          : '#f0fdf4',
                    color:
                      currentUser.role === 'ADMIN'
                        ? '#991b1b'
                        : currentUser.role === 'LOGISTIC'
                          ? '#1d4ed8'
                          : '#15803d',
                    border: `1px solid ${
                      currentUser.role === 'ADMIN'
                        ? '#fecaca'
                        : currentUser.role === 'LOGISTIC'
                          ? '#bfdbfe'
                          : '#bbf7d0'
                    }`,
                  }}
                >
                  {currentUser.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#8b2424',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Sign Out
              </button>
            </div>
          </header>

          {/* Protected Main Content */}
          <main style={{ padding: '36px 32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '32px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <h2 style={{ margin: '0 0 10px', fontSize: '22px', color: '#0f172a' }}>
                Welcome to Dispatch &amp; Pre-Registration
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '15px', lineHeight: 1.6 }}>
                You are authenticated as <strong>{currentUser.name}</strong> ({currentUser.role}). Select a menu option to manage truck arrivals, inspect gate schedules, or review active dispatch orders.
              </p>
            </div>
          </main>
        </div>
      ) : currentView === 'login' ? (
        <LoginPage
          onSuccess={(user) => setCurrentUser(user)}
          onForgotPassword={() => setCurrentView('forgot-password')}
        />
      ) : (
        <ForgotPasswordPage
          onBackToLogin={() => setCurrentView('login')}
        />
      )}
    </Suspense>
  )
}
