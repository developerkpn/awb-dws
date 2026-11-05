import type { UserFilters as Filters, UserOptions } from '@/types/user'

interface UserFiltersProps {
  filters: Filters
  options: UserOptions | undefined
  onChange: (changes: Partial<Filters>) => void
}

export default function UserFilters({ filters, options, onChange }: UserFiltersProps) {
  return (
    <div className="awb-toolbar">
      <input
        aria-label="Search accounts"
        placeholder="Search name, username, email or SAP code"
        maxLength={100}
        value={filters.q}
        onChange={(event) => onChange({ q: event.target.value })}
      />
      <select
        aria-label="Account type filter"
        value={filters.accountType}
        onChange={(event) => onChange({ accountType: event.target.value })}
      >
        <option value="">All account types</option>
        <option value="INTERNAL">Internal</option>
        <option value="PARTNER">Partner</option>
      </select>
      <select
        aria-label="Role filter"
        value={filters.role}
        onChange={(event) => onChange({ role: event.target.value })}
      >
        <option value="">All roles</option>
        {options?.roles.map((role) => (
          <option key={role.id} value={role.code}>
            {role.code}
          </option>
        ))}
      </select>
      <select
        aria-label="Plant filter"
        value={filters.plantId}
        onChange={(event) => onChange({ plantId: event.target.value })}
      >
        <option value="">All plants</option>
        {options?.plants.map((plant) => (
          <option key={plant.id} value={plant.id}>
            {plant.name}
          </option>
        ))}
      </select>
    </div>
  )
}
