import { z } from 'zod'
import { paginationQuery, permissionSortingQuery, roleSortingQuery } from '@awb/contracts'

export const accessListQuery = paginationQuery.extend({
  q: z.string().trim().max(100).default(''),
  module: z.string().trim().max(50).optional(),
})
export const permissionListQuery = accessListQuery.extend(permissionSortingQuery.shape)
export const roleListQuery = accessListQuery.extend(roleSortingQuery.shape)

export const roleIdParam = z.object({
  id: z.uuid(),
})

export const updateRolePermissionsSchema = z.object({
  permissionCodes: z
    .array(z.string().min(1).max(100))
    .max(100)
    .refine((value) => new Set(value).size === value.length, 'Duplicate permissions'),
})

export const checkAccessQuerySchema = z.object({
  role: z.string().min(1),
  permission: z.string().min(1),
})
