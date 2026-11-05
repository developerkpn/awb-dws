import { z } from 'zod'

export const roleIdParam = z.object({
  id: z.string().uuid(),
})
export type RoleIdParam = z.infer<typeof roleIdParam>

export const updateRolePermissionsSchema = z.object({
  permissionCodes: z.array(z.string().min(1)),
})
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>

export const checkAccessQuerySchema = z.object({
  role: z.string().min(1),
  permission: z.string().min(1),
})
export type CheckAccessQuery = z.infer<typeof checkAccessQuerySchema>
