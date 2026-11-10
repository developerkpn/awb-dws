import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/hooks/auth'
import type { PermissionSortField, RoleSortField } from '@awb/contracts'
import { fetchApi } from '@/utils/api'
import type {
  Permission,
  RoleSummary,
  RolePermissions,
  UpdatePermissionsInput,
  AccessListFilters,
} from '@/types/permission'
import type { PaginatedResponse } from '@/types/api'

export const permissionKeys = {
  all: ['permissions'] as const,
  catalogue: (filters: AccessListFilters) => ['permissions', 'catalogue', filters] as const,
  roles: (filters: AccessListFilters) => ['permissions', 'roles', filters] as const,
  role: (id: string) => ['permissions', 'role', id] as const,
}

export function usePermissions(filters: AccessListFilters<PermissionSortField>) {
  return useQuery({
    queryKey: permissionKeys.catalogue(filters),
    queryFn: ({ signal }) =>
      fetchApi<PaginatedResponse<Permission>>('/access/permissions', {
        params: filters,
        signal,
      }),
  })
}

export function useRolePermissions(filters: AccessListFilters<RoleSortField>) {
  return useQuery({
    queryKey: permissionKeys.roles(filters),
    queryFn: ({ signal }) =>
      fetchApi<PaginatedResponse<RoleSummary>>('/access/roles', {
        params: filters,
        signal,
      }),
  })
}

export function useRole(id: string) {
  return useQuery({
    queryKey: permissionKeys.role(id),
    queryFn: ({ signal }) =>
      fetchApi<RolePermissions>(`/access/roles/${id}/permissions`, { signal }),
    enabled: !!id,
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
      queryClient.setQueryData(permissionKeys.role(updated.id), updated)

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['permissions', 'roles'],
        }),
        queryClient.invalidateQueries({ queryKey: authKeys.session }),
      ])
    },
  })
}
