import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@awb/ui'
import { useUsers, useUserOptions, useUpdateUserStatus, useResetUserPassword } from '@/hooks/user'
import { useDebounce } from '@/hooks/useDebounce'
import Pagination from '@/components/Pagination'
import ErrorState from '@/components/ErrorState'
import UserFilters from '@/pages/user/listUser/_components/UserFilters'
import UsersTable from '@/pages/user/listUser/_components/UsersTable'
import { getErrorMessage } from '@/utils/errorHandler'
import { getPage } from '@/utils/pagination'
import type { User, UserFilters as Filters } from '@/types/user'

export default function ListUser() {
  const [parameters, setParameters] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { notice?: string } | null
  const [notice, setNotice] = useState(state?.notice ?? '')
  const [error, setError] = useState('')
  const filters: Filters = {
    q: parameters.get('q') ?? '',
    accountType: parameters.get('accountType') ?? '',
    role: parameters.get('role') ?? '',
    plantId: parameters.get('plantId') ?? '',
    page: getPage(parameters.get('page')),
    limit: 25,
  }
  const search = useDebounce(filters.q)
  const users = useUsers({ ...filters, q: search })
  const options = useUserOptions()
  const statusMutation = useUpdateUserStatus()
  const resetMutation = useResetUserPassword()
  const isSaving = statusMutation.isPending || resetMutation.isPending

  const changeFilters = (changes: Partial<Filters>) => {
    const next = new URLSearchParams(parameters)
    next.set('page', '1')

    for (const [key, value] of Object.entries(changes)) {
      if (value === '') next.delete(key)
      else next.set(key, String(value))
    }

    setParameters(next, { replace: true })
  }

  const changeStatus = async (user: User) => {
    if (
      isSaving ||
      !window.confirm(`${user.isActive ? 'Deactivate' : 'Activate'} ${user.username}?`)
    )
      return

    setError('')

    try {
      await statusMutation.mutateAsync({ id: user.id, isActive: !user.isActive })
      setNotice('Account status updated.')
    } catch (failure) {
      setError(getErrorMessage(failure))
    }
  }

  const resetPassword = async (user: User) => {
    if (
      isSaving ||
      !window.confirm(`Reset the password for ${user.username}? All sessions will be revoked.`)
    )
      return

    setError('')

    try {
      const response = await resetMutation.mutateAsync(user.id)
      setNotice(response.message)
    } catch (failure) {
      setError(getErrorMessage(failure))
    }
  }

  return (
    <div className="awb-stack">
      <section className="awb-card">
        <div className="awb-toolbar">
          <div>
            <h1>User management</h1>
            <p>{users.data?.total ?? 0} accounts</p>
          </div>
          <Button onClick={() => navigate('/users/new')}>Add account</Button>
        </div>
        <UserFilters filters={filters} options={options.data} onChange={changeFilters} />
      </section>
      {(users.error || options.error) && (
        <ErrorState
          message={getErrorMessage(users.error ?? options.error)}
          onRetry={() => {
            void users.refetch()
            void options.refetch()
          }}
        />
      )}
      {error && (
        <p className="awb-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="awb-success" role="status">
          {notice}
        </p>
      )}
      <UsersTable
        users={users.data?.items ?? []}
        isLoading={users.isPending}
        isSaving={isSaving}
        onEdit={(id) => navigate(`/users/${id}/edit`)}
        onStatusChange={(user) => void changeStatus(user)}
        onResetPassword={(user) => void resetPassword(user)}
      />
      <Pagination
        page={filters.page}
        limit={filters.limit}
        total={users.data?.total ?? 0}
        isLoading={users.isFetching}
        onPageChange={(page) => changeFilters({ page })}
      />
    </div>
  )
}
