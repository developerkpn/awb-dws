import { useState, useEffect, lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const RolePermissionsPage = lazy(() => import('./pages/admin/RolePermissionsPage'))

export interface AuthUser {
  name: string
  username: string
  role: string
}

export interface MenuItem {
  id: string
  label: string
  requiredPermission: string
  icon: string
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { id: 'overview', label: 'Overview', requiredPermission: 'overview', icon: 'overview' },
  { id: 'prereg', label: 'Pre-Registration', requiredPermission: 'prereg:view', icon: 'file' },
  { id: 'approval', label: 'Approval Queue', requiredPermission: 'prereg:approval', icon: 'check-square' },
  { id: 'weighbridge', label: 'Weighbridge Monitor', requiredPermission: 'weighbridge:view', icon: 'scale' },
  { id: 'users', label: 'User Management', requiredPermission: 'admin:users', icon: 'users' },
  { id: 'roles', label: 'Role Permissions', requiredPermission: 'admin:roles', icon: 'shield' },
]

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['overview', 'prereg:view', 'prereg:create', 'prereg:approval', 'weighbridge:view', 'admin:users', 'admin:roles'],
  MANAGER: ['overview', 'prereg:view', 'prereg:approval', 'weighbridge:view'],
  LOGISTIC: ['overview', 'prereg:view', 'prereg:create', 'prereg:approval', 'weighbridge:view'],
  COMMERCIAL: ['overview', 'prereg:view'],
  KRANIWB: ['overview', 'weighbridge:view'],
  CUSTOMER: ['overview', 'prereg:view', 'prereg:create'],
  VENDOR: ['overview', 'prereg:view', 'prereg:create'],
}

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'forgot-password'>('login')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [activeTab, setActiveTab] = useState<string>('users')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(DEFAULT_ROLE_PERMISSIONS)
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)

  // Developer shortcut: Check URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === 'admin' || params.get('role') === 'admin') {
      setCurrentUser({
        name: 'Bambang Admin HO',
        username: 'admin',
        role: 'ADMIN',
      })
      setActiveTab('users')
    }
  }, [])

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentView('login')
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  // Acceptance Checklist 1: Menu mengikuti hak akses peran
  const currentRole = currentUser?.role || ''
  const allowedPermissions = rolePermissions[currentRole] || []
  const visibleMenus = ALL_MENU_ITEMS.filter((item) => {
    if (currentRole === 'ADMIN') return true
    if (item.requiredPermission === 'overview') return true
    return allowedPermissions.includes(item.requiredPermission)
  })

  // Ensure active tab is within visible menus
  useEffect(() => {
    if (visibleMenus.length > 0 && !visibleMenus.some((m) => m.id === activeTab)) {
      setActiveTab(visibleMenus[0]!.id)
    }
  }, [currentRole, visibleMenus, activeTab])

  const renderIcon = (type: string) => {
    switch (type) {
      case 'users':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )
      case 'shield':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        )
      case 'file':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        )
      case 'check-square':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        )
      case 'scale':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
            <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
            <path d="M7 21h10" />
            <path d="M12 3v18" />
            <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
          </svg>
        )
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
        )
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
              {/* Logo Area */}
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
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    padding: isSidebarOpen ? '6px 8px' : '6px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  title={isSidebarOpen ? 'Click to collapse sidebar' : 'Click to expand sidebar'}
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

            {/* User Profile & Role Switcher for RBAC Demo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Role Switcher Demo Control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  Role Test:
                </span>
                <select
                  value={currentUser.role}
                  onChange={(e) => {
                    const newRole = e.target.value
                    setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null))
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    cursor: 'pointer',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="LOGISTIC">LOGISTIC</option>
                  <option value="COMMERCIAL">COMMERCIAL</option>
                  <option value="KRANIWB">KRANIWB</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="VENDOR">VENDOR</option>
                </select>
              </div>

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
            {/* Dynamic RBAC Sidebar (Acceptance Checklist 1) */}
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
                    Navigation ({visibleMenus.length})
                  </div>
                )}

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {visibleMenus.map((menu) => {
                    const isActive = activeTab === menu.id
                    return (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => setActiveTab(menu.id)}
                        title={menu.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: isSidebarOpen ? '10px 14px' : '10px 0',
                          justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: isActive ? '#fef2f2' : 'transparent',
                          color: isActive ? '#8b2424' : '#64748b',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                      >
                        {renderIcon(menu.icon)}
                        {isSidebarOpen && (
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{menu.label}</span>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Sign Out at Bottom of Sidebar */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsSignOutModalOpen(true)}
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

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '16px 32px 48px', overflowY: 'auto' }}>
              {activeTab === 'users' ? (
                <AdminUsersPage />
              ) : activeTab === 'roles' ? (
                <RolePermissionsPage
                  onPermissionsChange={(updatedRoles) => {
                    const newMap: Record<string, string[]> = { ...rolePermissions }
                    for (const r of updatedRoles) {
                      newMap[r.code] = ['overview', ...r.permissions]
                    }
                    setRolePermissions(newMap)
                  }}
                />
              ) : (
                <div style={{ maxWidth: '1200px', margin: '24px auto' }}>
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
                      {ALL_MENU_ITEMS.find((m) => m.id === activeTab)?.label || 'Portal Section'}
                    </h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14.5px', lineHeight: 1.6 }}>
                      This section is active and restricted according to KPN AWB Role-Based Access Control (RBAC) policies.
                    </p>
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* Sign Out Confirmation Modal */}
          {isSignOutModalOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.55)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                zIndex: 1000,
              }}
              onClick={() => setIsSignOutModalOpen(false)}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '420px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  padding: '28px 24px',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Confirm Sign Out
                </h3>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
                  Are you sure you want to sign out of your account? You will need to log in again to access the portal.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setIsSignOutModalOpen(false)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignOutModalOpen(false)
                      handleLogout()
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Yes, Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
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
