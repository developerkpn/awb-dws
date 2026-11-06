import { useState } from 'react'
import { Button, FormError, Input, Skeleton, SummaryPopover } from '@awb/ui'
import { useUser } from '@/hooks/user'
import { Search } from '@/ui/icons'
import { getErrorMessage } from '@/utils/errorHandler'
import type { AccountListItem } from '@/types/user'

export default function PlantAccess({ user }: { user: AccountListItem }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const details = useUser(user.id, open)
  if (user.plantCount === 0)
    return <span className="text-xs text-stone-500">No assigned plants</span>
  const plants =
    details.data?.plantAccess.filter((plant) =>
      `${plant.name} ${plant.code}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? []
  const first = user.plantPreview[0]?.name ?? ''
  return (
    <SummaryPopover
      label={`Plant access for ${user.username}`}
      summary={`${user.plantCount} ${user.plantCount === 1 ? 'plant' : 'plants'}`}
      preview={`${first}${user.plantCount > 1 ? ` · +${user.plantCount - 1} more` : ''}`}
      onOpenChange={(expanded) => {
        setOpen(expanded)
        if (!expanded) setSearch('')
      }}
    >
      <h2 className="mb-3 text-sm font-semibold">Assigned plants</h2>
      {details.isPending ? (
        <div role="status" aria-label="Loading assigned plants" className="space-y-3">
          <Skeleton style={{ height: '2.625rem' }} />
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} style={{ height: '3rem' }} />
          ))}
        </div>
      ) : details.error ? (
        <>
          <FormError message={getErrorMessage(details.error)} />
          <Button variant="secondary" size="sm" onClick={() => void details.refetch()}>
            Retry
          </Button>
        </>
      ) : (
        <>
          <Input
            leadingIcon={<Search />}
            aria-label="Search assigned plants"
            placeholder="Search name or code…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <ul className="account-plant-list">
            {plants.map((plant) => (
              <li key={plant.id}>
                <strong>{plant.name}</strong>
                <span>{plant.code}</span>
              </li>
            ))}
          </ul>
          {plants.length === 0 && (
            <p className="mt-3 text-sm text-stone-500">No matching plants.</p>
          )}
        </>
      )}
    </SummaryPopover>
  )
}
