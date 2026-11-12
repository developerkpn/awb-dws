import { PageSkeleton } from '@awb/ui'
import { useLocation } from 'react-router'
import type { LoadingStateProps } from '@/types/layout'

export default function LoadingState({ shell }: LoadingStateProps) {
  const { pathname } = useLocation()

  if (pathname === '/registrations/new') return <PageSkeleton view="form" back shell={shell} />

  return <PageSkeleton view="table" toolbar="search" action subtitle shell={shell} />
}
