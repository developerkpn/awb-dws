import { prisma } from '../../config/prisma'
import { permissionCatalogue } from './permissions'

export default {
  /**
   * Get all defined permissions in the system, grouped/ordered by module
   */
  async findAllPermissions() {
    return prisma.permission.findMany({
      where: { code: { in: permissionCatalogue.map((p) => p[0]) } },
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    })
  },

  /**
   * Get all active roles with their associated permissions
   */
  async findAllRolesWithPermissions() {
    return prisma.role.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    })
  },

  /**
   * Find role by ID with permissions
   */
  async findRoleById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
  },

  /**
   * Find role by code (e.g. 'ADMIN', 'LOGISTIC') with permissions
   */
  async findRoleByCode(code: string) {
    return prisma.role.findUnique({
      where: { code },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
  },

  /**
   * Find permissions by codes
   */
  async findPermissionsByCodes(codes: string[]) {
    return prisma.permission.findMany({
      where: {
        code: { in: codes },
      },
    })
  },

  /**
   * Update role permissions atomically
   */
  async updateRolePermissions(roleId: string, permissionIds: string[], actorId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${roleId}))`
      // 1. Remove existing permissions for this role
      await tx.rolePermission.deleteMany({
        where: { roleId },
      })

      // 2. Insert newly selected permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        })
      }

      await tx.accountAudit.create({
        data: { actorId, subjectId: roleId, action: 'role.permissions_updated' },
      })
      // Each authenticated request reloads permissions, so revocations take effect immediately.
      return tx.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })
    })
  },

  /**
   * Check if a role has a specific permission
   */
  async hasPermission(roleCode: string, permissionCode: string): Promise<boolean> {
    const role = await prisma.role.findUnique({
      where: { code: roleCode },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role || !role.isActive) return false

    return role.permissions.some((rp) => rp.permission.code === permissionCode)
  },
}
