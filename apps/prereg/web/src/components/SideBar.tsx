import { NavLink, useNavigate } from 'react-router'
import { PERMISSION } from '@/constant/PERMISSION'
import { useAuth } from '@/hooks/auth'
import { hasPermission } from '@/utils/permission'
import { getErrorMessage } from '@/utils/errorHandler'

export default function SideBar({ collapsed }: { collapsed: boolean }) {
  const { user, logoutMutation } = useAuth()
  const navigate = useNavigate()
  const items = [
    { to: '/', label: 'Overview', show: true },
    {
      to: '/users',
      label: 'User management',
      show: user?.role === 'ADMIN' && hasPermission(user, PERMISSION.USER.READ),
    },
    {
      to: '/roles/permissions',
      label: 'Role permissions',
      show: user?.role === 'ADMIN' && hasPermission(user, PERMISSION.ROLE.READ),
    },
    {
      to: '/pre-registration',
      label: 'Pre-registration',
      show: hasPermission(user, PERMISSION.PREREG.READ),
    },
    {
      to: '/approval',
      label: 'Approval queue',
      show: hasPermission(user, PERMISSION.PREREG.APPROVE),
    },
  ].filter((item) => item.show)

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync()
      navigate('/login', { replace: true })
    } catch {
      // The mutation error is rendered next to the sign-out control.
    }
  }

  return (
    <aside className={collapsed ? 'awb-sidebar collapsed' : 'awb-sidebar'}>
      <nav>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={item.label}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {collapsed ? item.label.slice(0, 1) : item.label}
          </NavLink>
        ))}
      </nav>
      <div>
        {logoutMutation.error && (
          <p role="alert" className="awb-error">
            {getErrorMessage(logoutMutation.error)}
          </p>
        )}
        <button
          className="awb-signout"
          disabled={logoutMutation.isPending}
          onClick={() => void logout()}
        >
          {logoutMutation.isPending ? 'Signing out…' : collapsed ? '↪' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
