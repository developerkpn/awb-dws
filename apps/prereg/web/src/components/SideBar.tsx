import { NavLink, useNavigate } from 'react-router'
import { ThemeControl } from '@awb/ui'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardList,
  CheckSquare,
  PackageOpen,
  LogOut,
  Profile,
  Download,
  Truck,
} from '@/ui/icons'
import { PERMISSION } from '@/constant/PERMISSION'
import { useAuth } from '@/hooks/auth'
import { hasPermission } from '@/utils/permission'
import { getErrorMessage } from '@/utils/errorHandler'
import type { NavGroup, NavItem } from '@/types/layout'

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      aria-label={item.label}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center ${collapsed ? 'justify-center' : ''} gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        }`
      }
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}

export default function SideBar({ collapsed }: { collapsed: boolean }) {
  const { user, logoutMutation } = useAuth()
  const navigate = useNavigate()

  const groups: NavGroup[] = [
    {
      label: 'General',
      items: [
        {
          to: '/',
          label: 'Overview',
          icon: <LayoutDashboard className="size-4.5" />,
          end: true,
          show: true,
        },
      ],
    },
    {
      label: 'Administration',
      items: [
        {
          to: '/users',
          label: 'User management',
          icon: <Users className="size-4.5" />,
          show: user?.role === 'ADMIN' && hasPermission(user, PERMISSION.USER.READ),
        },
        {
          to: '/roles',
          label: 'Roles & permissions',
          icon: <ShieldCheck className="size-4.5" />,
          show: user?.role === 'ADMIN' && hasPermission(user, PERMISSION.ROLE.READ),
        },
        {
          to: '/sap-master',
          label: 'SAP drivers & trucks',
          icon: <Download className="size-4.5" />,
          show: user?.role === 'ADMIN',
        },
      ],
    },
    {
      label: 'Operations',
      items: [
        {
          to: '/bel',
          label: 'BEL registrations',
          icon: <PackageOpen className="size-4.5" />,
          end: true,
          show: hasPermission(user, PERMISSION.PREREG.READ) && user?.role !== 'CUSTOMER',
        },
        {
          to: '/bel/review',
          label: 'BEL review',
          icon: <CheckSquare className="size-4.5" />,
          show:
            hasPermission(user, PERMISSION.PREREG.APPROVE) &&
            ['ADMIN', 'LOGISTIC'].includes(user?.role ?? ''),
        },
        {
          to: '/jul',
          label: 'JUL registrations',
          icon: <ClipboardList className="size-4.5" />,
          end: true,
          show: hasPermission(user, PERMISSION.PREREG.READ),
        },
        {
          to: '/jul/review',
          label: 'JUL review',
          icon: <CheckSquare className="size-4.5" />,
          show:
            hasPermission(user, PERMISSION.PREREG.APPROVE) &&
            ['ADMIN', 'LOGISTIC'].includes(user?.role ?? ''),
        },
        {
          to: '/driver-requests',
          label: 'Drivers & vehicles',
          icon: <Truck className="size-4.5" />,
          show: hasPermission(user, PERMISSION.PREREG.READ),
        },
      ],
    },
  ]

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync()
      navigate('/login', { replace: true })
    } catch {
      // error shown below
    }
  }

  return (
    <aside
      id="app-sidebar"
      aria-label="Sidebar"
      className={`relative z-30 flex h-full shrink-0 flex-col bg-[#f4f5f7] transition-[width] duration-200 ${collapsed ? 'w-[72px]' : 'w-60'}`}
    >
      <div
        className={`flex h-20 shrink-0 items-center ${collapsed ? 'justify-center px-3' : 'px-6'}`}
      >
        <div className={collapsed ? 'h-8 w-8 overflow-hidden' : 'w-36'}>
          <img
            src="/kpn-corp.png"
            alt="KPN"
            className={collapsed ? 'h-8 w-auto max-w-none' : 'h-auto w-full'}
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {groups.map((group) => {
          const visible = group.items.filter((i) => i.show)

          if (visible.length === 0) return null

          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-1 px-3 text-xs font-medium text-stone-500">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {visible.map((item) => (
                  <NavItemLink key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="mx-3 mb-4 shrink-0 border-t border-stone-200/80 pt-4 space-y-3">
        {logoutMutation.error && !collapsed && (
          <p role="alert" className="rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-700">
            {getErrorMessage(logoutMutation.error)}
          </p>
        )}
        <div className={`flex ${collapsed ? 'flex-col' : ''} items-center gap-2`}>
          <span
            role="img"
            aria-label="Account profile"
            title={user?.name}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500"
          >
            <Profile className="size-5" aria-hidden="true" />
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-stone-800">{user?.name}</p>
              <p className="mt-0.5 text-xs text-stone-500">{user?.role}</p>
            </div>
          )}
          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            disabled={logoutMutation.isPending}
            onClick={() => void logout()}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white hover:text-brand-700 disabled:opacity-50"
          >
            <LogOut className="size-4.5 shrink-0" />
          </button>
          <ThemeControl />
        </div>
      </div>
    </aside>
  )
}
