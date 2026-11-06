import { PageSkeleton } from '@awb/ui'
import { useLocation } from 'react-router'
import { loadingColumnsFor } from '@/ui/loadingLayouts'

export default function LoadingState({ message, shell }: { message?: string; shell?: boolean }) {
  const { pathname } = useLocation()
  if (pathname === '/login')
    return (
      <PageSkeleton
        message={message}
        view="auth"
        heroImage="/auth-hero-bg.jpg"
        logo="/kpn-corp.png"
      />
    )
  if (pathname === '/forgot-password') return <PageSkeleton message={message} view="recovery" />
  if (pathname === '/users/new' || /^\/users\/[^/]+\/edit$/.test(pathname))
    return <PageSkeleton message={message} view="form" back shell={shell} />
  if (pathname === '/users')
    return (
      <PageSkeleton
        message={message}
        view="table"
        columns={loadingColumnsFor('accounts')}
        subtitle={false}
        tableMinWidth="62rem"
        toolbar="filters"
        action
        shell={shell}
      />
    )
  if (/^\/roles\/[^/]+\/permissions$/.test(pathname))
    return (
      <PageSkeleton
        message={message}
        view="table"
        columns={loadingColumnsFor('permissions')}
        grouped
        back
        saveBar
        shell={shell}
      />
    )
  if (pathname.startsWith('/roles'))
    return (
      <PageSkeleton
        message={message}
        view="table"
        columns={loadingColumnsFor('roles')}
        subtitle={false}
        shell={shell}
      />
    )
  return (
    <PageSkeleton message={message} view={pathname === '/' ? 'cards' : 'message'} shell={shell} />
  )
}
