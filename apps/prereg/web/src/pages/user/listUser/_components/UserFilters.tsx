import { Button, Input, MultiSelect } from '@awb/ui'
import { Search } from '@/ui/icons'
import type { UserFiltersProps } from '@/types/user'

export default function UserFilters({ filters, options, onChange }: UserFiltersProps) {
  return (
    <div className="account-filter-toolbar" aria-label="Account filters">
      <div className="account-filter-search">
        <Input
          leadingIcon={<Search />}
          type="search"
          aria-label="Search accounts"
          placeholder="Search accounts…"
          maxLength={100}
          value={filters.q}
          onChange={(event) => onChange({ q: event.target.value })}
        />
      </div>
      <MultiSelect
        label="Roles"
        options={
          options?.roles.map((role) => ({
            value: role.code,
            label: role.name,
            description: role.code !== role.name ? role.code : undefined,
          })) ?? []
        }
        values={filters.roles}
        onChange={(roles) => onChange({ roles })}
        disabled={!options}
      />
      <MultiSelect
        label="Plants"
        options={
          options?.plants.map((plant) => ({
            value: plant.id,
            label: plant.name,
            description: plant.code,
          })) ?? []
        }
        values={filters.plantIds}
        onChange={(plantIds) => onChange({ plantIds })}
        disabled={!options}
      />
      {(filters.q || filters.roles.length > 0 || filters.plantIds.length > 0) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({
              q: '',
              roles: [],
              plantIds: [],
            })
          }
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
