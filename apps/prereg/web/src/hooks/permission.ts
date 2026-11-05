import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/hooks/auth'
import { fetchApi } from '@/utils/api'
import type { Permission, RolePermissions, UpdatePermissionsInput } from '@/types/permission'

export const permissionKeys = {
  catalogue: ['permissions', 'catalogue'] as const,
  roles: ['permissions', 'roles'] as const,
}

export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.catalogue,
    queryFn: ({ signal }) => fetchApi<Permission[]>('/access/permissions', { signal }),
  })
}

export function useRolePermissions() {
  return useQuery({
    queryKey: permissionKeys.roles,
    queryFn: ({ signal }) => fetchApi<RolePermissions[]>('/access/roles', { signal }),
  })
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, permissionCodes }: UpdatePermissionsInput) =>
      fetchApi<RolePermissions>(`/access/roles/${id}/permissions`, {
        method: 'PUT',
        data: { permissionCodes },
      }),
    onSuccess: async (updated) => {
      queryClient.setQueryData<RolePermissions[]>(permissionKeys.roles, (previous) =>
        previous?.map((role) => (role.id === updated.id ? updated : role)),
      )
      await queryClient.invalidateQueries({ queryKey: authKeys.session })
    },
  })
}
