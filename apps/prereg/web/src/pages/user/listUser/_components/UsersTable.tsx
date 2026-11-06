import { tableLayout } from '@/ui/loadingLayouts'
import { Table, type TableColumn } from '@/ui/Table'
import { IconButton } from '@/ui/Button'
import { Pencil, PowerOff, Power, KeyRound } from '@/ui/icons'
import PlantAccess from './PlantAccess'
import type { AccountListItem } from '@/types/user'
import type { ServerPagination, ServerSorting } from '@awb/ui'

interface UsersTableProps {
  sorting: ServerSorting
  pagination: ServerPagination
  users: AccountListItem[]
  isLoading: boolean
  isSaving: boolean
  onEdit: (id: string) => void
  onStatusChange: (user: AccountListItem) => void
  onResetPassword: (user: AccountListItem) => void
}

export default function UsersTable({
  sorting,
  pagination,
  users,
  isLoading,
  isSaving,
  onEdit,
  onStatusChange,
  onResetPassword,
}: UsersTableProps) {
  const columns: TableColumn<AccountListItem>[] = [
    {
      key: 'name',
      header: 'User',
      sortKey: 'name',
      render: (user) => (
        <div className="account-identity-cell">
          <p className="font-medium text-stone-900" title={user.name}>
            {user.name}
          </p>
          <p className="text-xs text-stone-500" title={user.username}>
            {user.username}
          </p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortKey: 'role',
      render: (user) => (
        <div className="account-role-cell">
          <p className="text-sm text-stone-700">{user.roleName}</p>
          <p className="text-xs text-stone-500">
            {user.accountType === 'PARTNER' ? 'Business partner' : 'Internal staff'}
          </p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      sortKey: 'email',
      sortHint: 'Sort by email',
      render: (user) => (
        <div className="account-contact-cell">
          {user.email && (
            <p className="text-xs text-stone-600" title={user.email}>
              {user.email}
            </p>
          )}
          {user.phone && (
            <p className="text-xs text-stone-500" title={user.phone}>
              {user.phone}
            </p>
          )}
          {!user.email && !user.phone && (
            <span className="text-xs text-stone-500">Not provided</span>
          )}
        </div>
      ),
    },
    {
      key: 'plants',
      header: 'Plant access',
      sortKey: 'plantAccess',
      sortHint: 'Sort by number of assigned plants',
      render: (user) => <PlantAccess user={user} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'isActive',
      render: (user) => (
        <span className="text-sm text-stone-600">{user.isActive ? 'Active' : 'Inactive'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (user) => (
        <div className="flex items-center justify-end gap-1.5">
          <IconButton label="Edit" disabled={isSaving} onClick={() => onEdit(user.id)}>
            <Pencil className="size-3.5" />
          </IconButton>
          <IconButton
            label={user.isActive ? 'Deactivate' : 'Activate'}
            disabled={isSaving}
            onClick={() => onStatusChange(user)}
          >
            {user.isActive ? (
              <PowerOff className="size-3.5 text-brand-700" />
            ) : (
              <Power className="size-3.5 text-emerald-700" />
            )}
          </IconButton>
          <IconButton
            label="Reset password"
            disabled={isSaving}
            onClick={() => onResetPassword(user)}
          >
            <KeyRound className="size-3.5" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <Table
      minWidth="62rem"
      sorting={sorting}
      pagination={pagination}
      aria-label="User accounts"
      columns={tableLayout('accounts', columns)}
      data={users}
      keyExtractor={(u) => u.id}
      isLoading={isLoading}
      emptyMessage="No accounts found"
      emptyDescription="Try adjusting your search or filters."
    />
  )
}
