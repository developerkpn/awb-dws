import { tableLayout } from '@/ui/loadingLayouts'
import { Link, useNavigate } from 'react-router'
import { IconButton } from '@awb/ui'
import { Settings } from '@/ui/icons'
import { useRolePermissions } from '@/hooks/permission'
import { usePagination } from '@/hooks/usePagination'
import { useSorting } from '@/hooks/useSorting'
import { roleSortFields } from '@awb/contracts'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/ui/Card'
import { Input } from '@/ui/Field'
import { Table } from '@/ui/Table'
import ErrorState from '@/components/ErrorState'
import { getErrorMessage } from '@/utils/errorHandler'
import type { RoleSummary } from '@/types/permission'

export default function ListRole() {
  const navigate = useNavigate()
  const pagination = usePagination()
  const { sortBy, sortDirection, sorting } = useSorting(roleSortFields, 'code')
  const search = useDebounce(pagination.q)

  const roles = useRolePermissions({
    page: pagination.page,
    limit: pagination.limit,
    q: search,
    sortBy,
    sortDirection,
  })

  const error = roles.error

  return (
    <>
      <PageHeader title="Roles & permissions" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Input
            aria-label="Search roles"
            value={pagination.q}
            onChange={(event) => pagination.onSearchChange(event.target.value)}
            placeholder="Find a role…"
          />
        </div>
        <span className="text-xs text-stone-400">{roles.data?.total ?? 0} roles</span>
      </div>
      {error ? (
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => {
            void roles.refetch()
          }}
        />
      ) : (
        <Table<RoleSummary>
          sorting={{
            ...sorting,
            isLoading: roles.isFetching,
          }}
          pagination={{
            ...pagination,
            total: roles.data?.total ?? 0,
            isLoading: roles.isFetching,
          }}
          isLoading={roles.isPending}
          aria-label="Roles"
          data={roles.data?.items ?? []}
          keyExtractor={(role) => role.id}
          columns={tableLayout('roles', [
            {
              key: 'role',
              header: 'Role',
              sortKey: 'name',
              render: (role) => (
                <div className="flex items-center gap-3">
                  <div>
                    <Link
                      to={`/roles/${role.id}/permissions`}
                      className="font-medium text-stone-800 hover:text-brand-700"
                    >
                      {role.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-stone-500">{role.code}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'description',
              header: 'Description',
              sortKey: 'description',
              className: 'max-w-xs text-xs',
              render: (role) => role.description ?? 'Workspace role',
            },
            {
              key: 'permissions',
              header: 'Access',
              sortKey: 'permissionCount',
              sortHint: 'Sort by number of assigned permissions',
              render: (role) =>
                role.code === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-brand-700">
                    Full access
                  </span>
                ) : (
                  <span className="text-xs text-stone-500">{role.permissionCount} permissions</span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              sortKey: 'isActive',
              render: (role) => (
                <span className="text-sm text-stone-600">
                  {role.isActive ? 'Active' : 'Inactive'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (role) => (
                <IconButton
                  label={`Manage ${role.code} permissions`}
                  onClick={() => navigate(`/roles/${role.id}/permissions`)}
                >
                  <Settings />
                </IconButton>
              ),
            },
          ])}
        />
      )}
    </>
  )
}
