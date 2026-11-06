import type { CSSProperties } from 'react'
import { Skeleton } from '../atoms/Skeleton'

export interface SkeletonCellProps {
  kind?: 'text' | 'badge' | 'checkbox' | 'actions'
  lines?: 1 | 2
  width?: CSSProperties['width']
  count?: number
}

export function SkeletonCell({
  kind = 'text',
  lines = 1,
  width = '75%',
  count = 3,
}: SkeletonCellProps) {
  if (kind === 'badge')
    return <Skeleton style={{ width: '3.5rem', height: '1.375rem', borderRadius: '0.375rem' }} />
  if (kind === 'checkbox')
    return <Skeleton style={{ width: '1rem', height: '1rem', borderRadius: '0.25rem' }} />
  if (kind === 'actions')
    return (
      <div className="ui-skeleton-actions">
        {Array.from({ length: count }, (_, index) => (
          <Skeleton
            key={index}
            style={{ width: '2rem', height: '2rem', borderRadius: '0.625rem' }}
          />
        ))}
      </div>
    )
  return (
    <div className="ui-table-skeleton-cell">
      <Skeleton style={{ width }} />
      {lines === 2 && <Skeleton style={{ width: '55%', height: '0.75rem' }} />}
    </div>
  )
}
