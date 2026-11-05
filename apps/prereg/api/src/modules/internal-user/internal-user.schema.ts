import { z } from 'zod'

export const INTERNAL_ROLES = [
  'ADMIN',
  'MANAGER',
  'LOGISTIC',
  'COMMERCIAL',
  'KRANIWB',
] as const

export const userIdParam = z.object({
  id: z.string().uuid(),
})
export type UserIdParam = z.infer<typeof userIdParam>

export const createInternalUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  role: z.enum(INTERNAL_ROLES, {
    message: `Role must be one of: ${INTERNAL_ROLES.join(', ')}`,
  }),
  plantIds: z.array(z.string().uuid()).optional().default([]),
})
export type CreateInternalUserInput = z.infer<typeof createInternalUserSchema>

export const updateInternalUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(INTERNAL_ROLES).optional(),
  plantIds: z.array(z.string().uuid()).optional(),
})
export type UpdateInternalUserInput = z.infer<typeof updateInternalUserSchema>

export const updateStatusSchema = z.object({
  isActive: z.boolean(),
})
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>
