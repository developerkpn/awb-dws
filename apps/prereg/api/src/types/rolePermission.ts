import type repository from '../modules/role-permission/role-permission.repository'
import type { z } from 'zod'
import type {
  accessListQuery,
  permissionListQuery,
  roleListQuery,
  roleIdParam,
  updateRolePermissionsSchema,
  checkAccessQuerySchema,
} from '../modules/role-permission/role-permission.schema'

export type AccessListQuery = z.infer<typeof accessListQuery>

export type PermissionListQuery = z.infer<typeof permissionListQuery>

export type RoleListQuery = z.infer<typeof roleListQuery>

export type RoleIdParam = z.infer<typeof roleIdParam>

export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>

export type CheckAccessQuery = z.infer<typeof checkAccessQuerySchema>

export type RoleRecord = NonNullable<Awaited<ReturnType<typeof repository.findRoleById>>>
