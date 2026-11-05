import { Table, type TableColumn } from '@awb/ui'
import type { User } from '@/types/user'

interface UsersTableProps {
  users: User[]
  isLoading: boolean
  isSaving: boolean
  onEdit: (id: string) => void
  onStatusChange: (user: User) => void
  onResetPassword: (user: User) => void
}

export default function UsersTable({
  users,
  isLoading,
  isSaving,
  onEdit,
  onStatusChange,
  onResetPassword,
}: UsersTableProps) {
  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      header: 'User',
      render: (user) => (
        <div>
          <strong>{user.name}</strong>
          <div>{user.username}</div>
          <small>{user.email}</small>
        </div>
      ),
    },
    { key: 'type', header: 'Account type', render: (user) => user.accountType },
    { key: 'role', header: 'Role', render: (user) => user.role },
    {
      key: 'partners',
      header: 'SAP codes',
      render: (user) => user.partners.map((partner) => partner.sapCode).join(', ') || '—',
    },
    {
      key: 'plants',
      header: 'Plant access',
      render: (user) =>
        user.accountType === 'PARTNER'
          ? user.plantAccess.map((plant) => plant.name).join(', ') || 'No plants assigned'
          : '—',
    },
    { key: 'status', header: 'Status', render: (user) => (user.isActive ? 'Active' : 'Inactive') },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="awb-actions">
          <button disabled={isSaving} onClick={() => onEdit(user.id)}>
            Edit
          </button>
          <button disabled={isSaving} onClick={() => onStatusChange(user)}>
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button disabled={isSaving} onClick={() => onResetPassword(user)}>
            Reset password
          </button>
        </div>
      ),
    },
  ]

  return (
    <Table columns={columns} data={users} keyExtractor={(user) => user.id} isLoading={isLoading} />
  )
}
