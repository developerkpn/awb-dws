import { Users, ShieldCheck } from '@/ui/icons'
import { Link } from 'react-router'
import { useAuth } from '@/hooks/auth'
import { PERMISSION } from '@/constant/PERMISSION'
import { hasPermission } from '@/utils/permission'

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.name.split(' ')[0] ?? 'there'

  const day = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const cards = [
    {
      icon: <Users className="size-5" />,
      label: 'User management',
      description: 'Manage internal and partner accounts.',
      href: '/users',
      color: 'bg-brand-50 text-brand-700',
      show: user?.role === 'ADMIN' && hasPermission(user, PERMISSION.USER.READ),
    },
    {
      icon: <ShieldCheck className="size-5" />,
      label: 'Role permissions',
      description: 'Configure what each role can access.',
      href: '/roles',
      color: 'bg-sky-50 text-sky-700',
      show: user?.role === 'ADMIN' && hasPermission(user, PERMISSION.ROLE.READ),
    },
  ].filter((card) => card.show)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-500">{day}</p>
        <h1 className="text-2xl font-semibold text-ink">Overview</h1>
        <p className="mt-1 text-sm text-stone-500">
          Welcome back, {firstName}. Use the sidebar to navigate.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            to={c.href}
            className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
          >
            <span className={`mt-0.5 rounded-lg p-2.5 ${c.color}`}>{c.icon}</span>
            <div>
              <p className="font-medium text-stone-900">{c.label}</p>
              <p className="mt-0.5 text-sm text-stone-500">{c.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
