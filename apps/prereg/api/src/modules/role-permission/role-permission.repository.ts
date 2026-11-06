import { prisma } from '../../config/prisma'
import { permissionCatalogue } from './permissions'
import type { PermissionListQuery, RoleListQuery } from './role-permission.schema'
import { Prisma } from '../../generated/prisma/client'

export default {
  /**
   * Get all defined permissions in the system, grouped/ordered by module
   */
  async findAllPermissions({ page, limit, q, module, sortBy, sortDirection }: PermissionListQuery) {
    const literal = q.replace(/[\\%_]/g, '\\$&')
    const where: Prisma.PermissionWhereInput = {
      code: { in: permissionCatalogue.map((p) => p[0]) },
      module,
      ...(q
        ? {
            OR: [
              { name: { contains: literal, mode: 'insensitive' } },
              { code: { contains: literal, mode: 'insensitive' } },
              { module: { contains: literal, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const orderBy: Prisma.PermissionOrderByWithRelationInput[] = [
      { module: sortBy === 'module' ? sortDirection : 'asc' },
      ...(sortBy === 'name' ? [{ name: sortDirection }] : []),
      { code: sortBy === 'code' ? sortDirection : 'asc' },
      { id: 'asc' },
    ]
    const direction = sortDirection === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`
    const pattern = `%${literal}%`
    const rows =
      sortBy === 'action'
        ? prisma.$queryRaw<{ id: string; code: string; name: string; module: string }[]>(Prisma.sql`
          SELECT id, code, name, module FROM mst_permission
          WHERE code IN (${Prisma.join(permissionCatalogue.map((permission) => permission[0]))})
          ${module ? Prisma.sql`AND module = ${module}` : Prisma.empty}
          ${q ? Prisma.sql`AND (name ILIKE ${pattern} OR code ILIKE ${pattern} OR module ILIKE ${pattern})` : Prisma.empty}
          ORDER BY module ASC, substring(code from '[^:]+$') ${direction}, code ASC, id ASC
          LIMIT ${limit} OFFSET ${(page - 1) * limit}
        `)
        : prisma.permission.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            select: { id: true, code: true, name: true, module: true },
          })
    const [items, total] = await prisma.$transaction([rows, prisma.permission.count({ where })], {
      isolationLevel: 'RepeatableRead',
    })
    return { items, total, page, limit }
  },

  /**
   * Get all active roles with their associated permissions
   */
  async findAllRolesWithPermissions({ page, limit, q, sortBy, sortDirection }: RoleListQuery) {
    const literal = q.replace(/[\\%_]/g, '\\$&')
    const where: Prisma.RoleWhereInput = {
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: literal, mode: 'insensitive' } },
              { code: { contains: literal, mode: 'insensitive' } },
              { description: { contains: literal, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const order: Record<RoleListQuery['sortBy'], Prisma.RoleOrderByWithRelationInput> = {
      code: { code: sortDirection },
      name: { name: sortDirection },
      description: { description: { sort: sortDirection, nulls: 'last' } },
      permissionCount: { permissions: { _count: sortDirection } },
      isActive: { isActive: sortDirection },
    }
    const [roles, total] = await prisma.$transaction(
      [
        prisma.role.findMany({
          where,
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            isActive: true,
            _count: { select: { permissions: true } },
          },
          orderBy: [order[sortBy], { id: sortDirection }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.role.count({ where }),
      ],
      { isolationLevel: 'RepeatableRead' },
    )
    return {
      items: roles.map(({ _count, ...role }) => ({ ...role, permissionCount: _count.permissions })),
      total,
      page,
      limit,
    }
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
