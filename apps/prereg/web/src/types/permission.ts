export interface Permission {
  code: string
  name: string
  module: string
}

export interface RolePermissions {
  id: string
  code: string
  name: string
  permissionCodes: string[]
}

export interface UpdatePermissionsInput {
  id: string
  permissionCodes: string[]
}
