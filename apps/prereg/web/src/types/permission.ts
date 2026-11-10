export interface Permission {
  code: string
  name: string
  module: string
}

export interface RolePermissions {
  description?: string | null
  isActive: boolean
  id: string
  code: string
  name: string
  permissionCodes: string[]
}

export type RoleSummary = Omit<RolePermissions, 'permissionCodes'> & { permissionCount: number }
export interface AccessListFilters<K extends string = PermissionSortField | RoleSortField> {
  page: number
  limit: number
  q: string
  module?: string
  sortBy?: K
  sortDirection?: SortDirection
}

export interface UpdatePermissionsInput {
  id: string
  permissionCodes: string[]
}

import type { PermissionSortField, RoleSortField, SortDirection } from '@awb/contracts'

export interface PermissionEditorProps {
  role: RolePermissions
  onSave: (id: string, codes: string[]) => Promise<void>
}
