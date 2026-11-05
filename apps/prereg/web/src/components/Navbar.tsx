import { useAuth } from '@/hooks/auth'

export default function Navbar({ onToggle }: { onToggle: () => void }) {
  const { user } = useAuth()

  return (
    <header className="awb-header">
      <button className="awb-brand" aria-label="Toggle navigation" onClick={onToggle}>
        <img src="/kpn-corp.png" alt="KPN" />
      </button>
      <strong>AWB Customer Pre-Registration</strong>
      <div className="awb-profile">
        <span>{user?.name}</span>
        <small>
          {user?.username} · {user?.role}
        </small>
      </div>
    </header>
  )
}
