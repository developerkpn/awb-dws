import { CustomError, NotFoundError } from '@awb/server-core'
import repository from './role-permission.repository'

export function formatRolePermissions(role: any) {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    permissions: (role.permissions || []).map((rp: any) => ({
      id: rp.permission?.id || rp.permissionId,
      code: rp.permission?.code,
      name: rp.permission?.name,
      module: rp.permission?.module,
    })),
    permissionCodes: (role.permissions || []).map((rp: any) => rp.permission?.code).filter(Boolean),
  }
}

export default {
  /**
   * List all available permissions in the system
   */
  async listPermissions() {
    const permissions = await repository.findAllPermissions()
    return permissions.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      module: p.module,
    }))
  },

  /**
   * List all roles with their assigned permissions
   */
  async listRolesWithPermissions() {
    const roles = await repository.findAllRolesWithPermissions()
    return roles.map(formatRolePermissions)
  },

  /**
   * Get permissions for a single role
   */
  async getRolePermissions(id: string) {
    const role = await repository.findRoleById(id)
    if (!role) {
      throw new NotFoundError(`Role with ID '${id}' not found`)
    }
    return formatRolePermissions(role)
  },

  /**
   * Update role permissions (assign/revoke menu and page access)
   */
  async updateRolePermissions(roleId: string, permissionCodes: string[]) {
    const role = await repository.findRoleById(roleId)
    if (!role) {
      throw new NotFoundError(`Role with ID '${roleId}' not found`)
    }

    // Resolve permission IDs from codes
    let permissionIds: string[] = []
    if (permissionCodes.length > 0) {
      const permissions = await repository.findPermissionsByCodes(permissionCodes)
      if (permissions.length !== permissionCodes.length) {
        const foundCodes = new Set(permissions.map((p) => p.code))
        const missingCodes = permissionCodes.filter((c) => !foundCodes.has(c))
        throw new CustomError(
          `Invalid permission codes: ${missingCodes.join(', ')}`,
          400
        )
      }
      permissionIds = permissions.map((p) => p.id)
    }

    const updated = await repository.updateRolePermissions(roleId, permissionIds)
    return formatRolePermissions(updated)
  },

  /**
   * Check if a role has access to a specific permission/page
   */
  async checkRoleAccess(roleCode: string, permissionCode: string): Promise<boolean> {
    // ADMIN has full access by default, or verify in database
    if (roleCode === 'ADMIN') return true

    return repository.hasPermission(roleCode, permissionCode)
  },
}
