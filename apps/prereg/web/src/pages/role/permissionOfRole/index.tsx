import { usePermissions, useRolePermissions, useUpdateRolePermissions } from '@/hooks/permission'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import { RolePermissionsView } from '@/pages/role/permissionOfRole/_components/RolePermissionsTable'
import { getErrorMessage } from '@/utils/errorHandler'

export default function PermissionOfRole() {
  const permissions = usePermissions()
  const roles = useRolePermissions()
  const update = useUpdateRolePermissions()

  if (permissions.isPending || roles.isPending)
    return <LoadingState message="Loading role permissions…" />

  const error = permissions.error ?? roles.error
  if (error)
    return (
      <ErrorState
        message={getErrorMessage(error)}
        onRetry={() => {
          void permissions.refetch()
          void roles.refetch()
        }}
      />
    )

  const save = async (id: string, permissionCodes: string[]) => {
    await update.mutateAsync({ id, permissionCodes })
  }

  return (
    <RolePermissionsView
      roles={roles.data ?? []}
      permissions={permissions.data ?? []}
      onSaveRolePermissions={save}
    />
  )
}
