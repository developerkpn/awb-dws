import { CustomError, NotFoundError } from '@awb/server-core'
import repository from './role-permission.repository'
import { permissionCodes as supportedCodes } from './permissions'
import type { RoleRecord } from '../../types/rolePermission'
import type { PermissionListQuery, RoleListQuery } from '../../types/rolePermission'

export function formatRolePermissions(role: RoleRecord) {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    permissions: role.permissions.map((rp) => ({
      id: rp.permission?.id || rp.permissionId,
      code: rp.permission?.code,
      name: rp.permission?.name,
      module: rp.permission?.module,
    })),
    permissionCodes: role.permissions.map((rp) => rp.permission.code),
  }
}

export default {
  /**
   * List all available permissions in the system
   */
  async listPermissions(query: PermissionListQuery) {
    return repository.findAllPermissions(query)
  },

  /**
   * List all roles with their assigned permissions
   */
  async listRolesWithPermissions(query: RoleListQuery) {
    return repository.findAllRolesWithPermissions(query)
  },

  /**
   * Get permissions for a single role
   */
  async getRolePermissions(id: string) {
    const role = await repository.findRoleById(id)

    if (!role) {
      throw new NotFoundError(`RoleRecord with ID '${id}' not found`)
    }

    return formatRolePermissions(role)
  },

  /**
   * Update role permissions (assign/revoke menu and page access)
   */
  async updateRolePermissions(roleId: string, permissionCodes: string[], actorId: string) {
    const role = await repository.findRoleById(roleId)

    if (!role) {
      throw new NotFoundError(`RoleRecord with ID '${roleId}' not found`)
    }

    if (role.code === 'ADMIN')
      throw new CustomError('Administrator permissions cannot be restricted', 409)

    if (!role.isActive) throw new CustomError('RoleRecord is inactive', 422)

    if (permissionCodes.some((code) => !supportedCodes.has(code)))
      throw new CustomError('Unsupported permission code', 422)

    // Resolve permission IDs from codes
    let permissionIds: string[] = []

    if (permissionCodes.length > 0) {
      const permissions = await repository.findPermissionsByCodes(permissionCodes)

      if (permissions.length !== permissionCodes.length) {
        const foundCodes = new Set(permissions.map((p) => p.code))
        const missingCodes = permissionCodes.filter((c) => !foundCodes.has(c))

        throw new CustomError(`Invalid permission codes: ${missingCodes.join(', ')}`, 400)
      }

      permissionIds = permissions.map((p) => p.id)
    }

    const updated = await repository.updateRolePermissions(roleId, permissionIds, actorId)

    if (!updated) throw new NotFoundError('RoleRecord not found')

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
