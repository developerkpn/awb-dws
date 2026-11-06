import { z } from 'zod'
import { paginationQuery, permissionSortingQuery, roleSortingQuery } from '@awb/contracts'

export const accessListQuery = paginationQuery.extend({
  q: z.string().trim().max(100).default(''),
  module: z.string().trim().max(50).optional(),
})
export type AccessListQuery = z.infer<typeof accessListQuery>
export const permissionListQuery = accessListQuery.extend(permissionSortingQuery.shape)
export const roleListQuery = accessListQuery.extend(roleSortingQuery.shape)
export type PermissionListQuery = z.infer<typeof permissionListQuery>
export type RoleListQuery = z.infer<typeof roleListQuery>

export const roleIdParam = z.object({
  id: z.uuid(),
})
export type RoleIdParam = z.infer<typeof roleIdParam>

export const updateRolePermissionsSchema = z.object({
  permissionCodes: z
    .array(z.string().min(1).max(100))
    .max(100)
    .refine((value) => new Set(value).size === value.length, 'Duplicate permissions'),
})
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>

export const checkAccessQuerySchema = z.object({
  role: z.string().min(1),
  permission: z.string().min(1),
})
export type CheckAccessQuery = z.infer<typeof checkAccessQuerySchema>
