import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { UserPlus } from '@/ui/icons'
import { useUsers, useUserOptions, useUpdateUserStatus, useResetUserPassword } from '@/hooks/user'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'
import { accountSortFields } from '@awb/contracts'
import { useConfirm } from '@awb/ui'
import ErrorState from '@/components/ErrorState'
import UserFilters from './_components/UserFilters'
import UsersTable from './_components/UsersTable'
import { Button } from '@/ui/Button'
import { PageHeader } from '@/ui/Card'
import { Toast, ToastStack } from '@/ui/Toast'
import { getErrorMessage } from '@/utils/errorHandler'
import { getPage } from '@/utils/pagination'
import type { AccountListItem, UserFilters as Filters } from '@/types/user'

export default function ListUser() {
  const pagination = usePagination()
  const { sortBy, sortDirection, sorting } = useSorting(accountSortFields, 'createdAt', 'desc')
  const confirm = useConfirm()
  const [parameters, setParameters] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { notice?: string } | null

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    locationState?.notice
      ? {
          message: locationState.notice,
          type: 'success',
        }
      : null,
  )

  const filters: Filters = {
    sortBy,
    sortDirection,
    q: parameters.get('q') ?? '',
    roles: [...new Set(parameters.getAll('roles'))],
    plantIds: [...new Set(parameters.getAll('plantIds'))],
    page: getPage(parameters.get('page')),
    limit: pagination.limit,
  }

  const debouncedQ = useDebounce(filters.q)

  const users = useUsers({
    ...filters,
    q: debouncedQ,
  })

  const options = useUserOptions()
  const statusMutation = useUpdateUserStatus()
  const resetMutation = useResetUserPassword()
  const isSaving = statusMutation.isPending || resetMutation.isPending

  const changeFilters = (changes: Partial<Filters>) => {
    const next = new URLSearchParams(parameters)

    for (const legacy of ['filters', 'role', 'plantId', 'accountType']) next.delete(legacy)
    next.set('page', '1')

    for (const [key, value] of Object.entries(changes)) {
      if (Array.isArray(value)) {
        next.delete(key)
        for (const item of value) next.append(key, item)
      } else if (value === '' || value === undefined) next.delete(key)
      else next.set(key, String(value))
    }

    setParameters(next, { replace: true })
  }

  const changeStatus = async (user: AccountListItem) => {
    if (
      isSaving ||
      !(await confirm({
        title: `${user.isActive ? 'Deactivate' : 'Activate'} account?`,
        description: `${user.username} ${user.isActive ? 'will lose access and existing sessions will end.' : 'will be able to sign in again.'}`,
        confirmLabel: user.isActive ? 'Deactivate' : 'Activate',
        variant: user.isActive ? 'danger' : 'primary',
      }))
    )
      return

    try {
      await statusMutation.mutateAsync({
        id: user.id,
        isActive: !user.isActive,
      })

      setToast({
        message: 'Account status updated.',
        type: 'success',
      })
    } catch (err) {
      setToast({
        message: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  const resetPassword = async (user: AccountListItem) => {
    if (
      isSaving ||
      !(await confirm({
        title: 'Reset password?',
        description: `Reset the password for ${user.username}. All existing sessions will end.`,
        confirmLabel: 'Reset password',
        variant: 'danger',
      }))
    )
      return

    try {
      const response = await resetMutation.mutateAsync(user.id)

      setToast({
        message: response.message,
        type: 'success',
      })
    } catch (err) {
      setToast({
        message: getErrorMessage(err),
        type: 'error',
      })
    }
  }

  const dataError = users.error ?? options.error

  return (
    <>
      <PageHeader
        title="User management"
        action={
          <Button icon={<UserPlus className="size-4" />} onClick={() => navigate('/users/new')}>
            Add account
          </Button>
        }
      />

      <UserFilters filters={filters} options={options.data} onChange={changeFilters} />

      {dataError ? (
        <ErrorState
          message={getErrorMessage(dataError)}
          onRetry={() => {
            void users.refetch()
            void options.refetch()
          }}
        />
      ) : (
        <>
          <UsersTable
            sorting={{
              ...sorting,
              isLoading: users.isFetching,
            }}
            pagination={{
              ...pagination,
              total: users.data?.total ?? 0,
              isLoading: users.isFetching,
            }}
            users={users.data?.items ?? []}
            isLoading={users.isPending}
            isSaving={isSaving}
            onEdit={(id) => navigate(`/users/${id}/edit`)}
            onStatusChange={(u) => void changeStatus(u)}
            onResetPassword={(u) => void resetPassword(u)}
          />
        </>
      )}

      {toast && (
        <ToastStack>
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        </ToastStack>
      )}
    </>
  )
}
