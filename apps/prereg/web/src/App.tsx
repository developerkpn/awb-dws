import { useState, useEffect, lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))

export interface AuthUser {
  name: string
  username: string
  role: string
}

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'forgot-password'>('login')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [adminTab, setAdminTab] = useState<'users' | 'overview'>('users')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Developer shortcut: Check URL params on initial load (e.g. ?view=admin)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === 'admin' || params.get('role') === 'admin') {
      setCurrentUser({
        name: 'Bambang Admin HO',
        username: 'admin',
        role: 'ADMIN',
      })
    }
  }, [])

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentView('login')
    // Clear URL params if any
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname)
    }
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
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#f8fafc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Main Top Header */}
          <header
            style={{
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              padding: '12px 32px 12px 0',
              borderBottom: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* Logo Area - aligned with sidebar column below */}
              <div
                style={{
                  width: isSidebarOpen ? '230px' : '68px',
                  minWidth: isSidebarOpen ? '230px' : '68px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  paddingLeft: isSidebarOpen ? '18px' : '0',
                  boxSizing: 'border-box',
                  transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser.role === 'ADMIN') {
                      setIsSidebarOpen((prev) => !prev)
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    padding: isSidebarOpen ? '6px 8px' : '6px',
                    borderRadius: '8px',
                    cursor: currentUser.role === 'ADMIN' ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (currentUser.role === 'ADMIN') {
                      e.currentTarget.style.backgroundColor = '#f1f5f9'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  title={
                    currentUser.role === 'ADMIN'
                      ? isSidebarOpen
                        ? 'Click logo to collapse sidebar'
                        : 'Click logo to expand sidebar'
                      : undefined
                  }
                >
                  {isSidebarOpen ? (
                    <img
                      src="/kpn-corp.png"
                      alt="KPN Logo"
                      style={{ height: '30px', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <img
                        src="/kpn-corp.png"
                        alt="KPN Logo"
                        style={{ height: '32px', maxWidth: 'none', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </button>
              </div>

              {/* Title with separator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '16px',
                  borderLeft: '1px solid #e2e8f0',
                  marginLeft: '4px',
                }}
              >
                <span style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a', userSelect: 'none' }}>
                  AWB Customer Pre-Registration
                </span>
              </div>
            </div>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {currentUser.username}
                </div>
              </div>

              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                }}
              >
                {currentUser.role}
              </span>
            </div>
          </header>

          {/* Main App Layout (Sidebar + Content) */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Collapsible Sidebar */}
            {currentUser.role === 'ADMIN' && (
              <aside
                style={{
                  width: isSidebarOpen ? '230px' : '68px',
                  minWidth: isSidebarOpen ? '230px' : '68px',
                  backgroundColor: '#ffffff',
                  borderRight: '1px solid #e2e8f0',
                  transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: isSidebarOpen ? '20px 12px 16px' : '20px 8px 16px',
                  boxSizing: 'border-box',
                  overflowY: 'auto',
                  flexShrink: 0,
                }}
              >
                <div>
                  {isSidebarOpen && (
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '0 12px 10px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      Navigation
                    </div>
                  )}

                  <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setAdminTab('users')}
                      title="User Management"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: isSidebarOpen ? '10px 14px' : '10px 0',
                        justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: adminTab === 'users' ? '#fef2f2' : 'transparent',
                        color: adminTab === 'users' ? '#8b2424' : '#64748b',
                        fontWeight: adminTab === 'users' ? 600 : 500,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {isSidebarOpen && (
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>User Management</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminTab('overview')}
                      title="Overview"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: isSidebarOpen ? '10px 14px' : '10px 0',
                        justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: adminTab === 'overview' ? '#fef2f2' : 'transparent',
                        color: adminTab === 'overview' ? '#8b2424' : '#64748b',
                        fontWeight: adminTab === 'overview' ? 600 : 500,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <rect x="3" y="3" width="7" height="9" />
                        <rect x="14" y="3" width="7" height="5" />
                        <rect x="14" y="12" width="7" height="9" />
                        <rect x="3" y="16" width="7" height="5" />
                      </svg>
                      {isSidebarOpen && (
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>Overview</span>
                      )}
                    </button>
                  </nav>
                </div>

                {/* Sign Out at the Bottom of Navbar/Sidebar (Instruction #1) */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: isSidebarOpen ? '10px 14px' : '10px 0',
                      justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#dc2626',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {isSidebarOpen && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>Sign Out</span>
                    )}
                  </button>
                </div>
              </aside>
            )}

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '12px 32px 48px', overflowY: 'auto' }}>
              {currentUser.role === 'ADMIN' ? (
                adminTab === 'users' ? (
                  <AdminUsersPage />
                ) : (
                  <div style={{ maxWidth: '1200px', margin: '32px auto' }}>
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '32px',
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}
                    >
                      <h2 style={{ margin: '0 0 10px', fontSize: '20px', color: '#0f172a' }}>
                        Plant Logistics Overview
                      </h2>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14.5px', lineHeight: 1.6 }}>
                        Active plant operations: <strong>Priscolin Karawang</strong>, <strong>Dumai</strong>, and <strong>Medan</strong>.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ maxWidth: '1200px', margin: '32px auto' }}>
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
                </div>
              )}
            </main>
          </div>
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
