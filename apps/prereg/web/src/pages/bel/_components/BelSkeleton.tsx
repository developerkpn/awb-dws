import { PageSkeleton } from '@awb/ui'

export function BelSkeleton({ view, shell }: { view: 'form' | 'detail'; shell?: boolean }) {
  return <PageSkeleton view={view === 'detail' ? 'form' : view} back shell={shell} />
}
