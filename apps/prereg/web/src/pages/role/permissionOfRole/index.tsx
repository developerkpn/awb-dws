import { useRole, useUpdateRolePermissions } from '@/hooks/permission'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import { useParams } from 'react-router'
import PermissionEditor from './_components/PermissionEditor'
import { getErrorMessage } from '@/utils/errorHandler'

export default function PermissionOfRole() {
  const { id = '' } = useParams()
  const role = useRole(id)
  const update = useUpdateRolePermissions()

  if (role.isPending) return <LoadingState message="Loading role…" />

  if (role.error || !role.data)
    return <ErrorState message={getErrorMessage(role.error)} onRetry={() => void role.refetch()} />

  return (
    <PermissionEditor
      key={id}
      role={role.data}
      onSave={async (id, permissionCodes) => {
        await update.mutateAsync({
          id,
          permissionCodes,
        })
      }}
    />
  )
}
