import { z } from 'zod'

/** A plant console account (mst_user in the plant database). */
export const operatorRoles = ['ADMIN', 'OPERATOR'] as const
export const operatorRole = z.enum(operatorRoles)
export type OperatorRole = z.infer<typeof operatorRole>

export const operatorSession = z.object({
  id: z.uuid(),
  username: z.string(),
  name: z.string(),
  role: operatorRole,
})
export type OperatorSession = z.infer<typeof operatorSession>

export const operatorLoginInput = z.object({
  username: z.string().trim().min(1, 'Username is required').max(100),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(72)
    .refine(
      (value) => encodeURIComponent(value).replace(/%[0-9A-F]{2}/g, '.').length <= 72,
      'Password exceeds 72 bytes',
    ),
  rememberMe: z.boolean().default(false),
})
export type OperatorLoginInput = z.input<typeof operatorLoginInput>
export type OperatorLoginData = z.output<typeof operatorLoginInput>
