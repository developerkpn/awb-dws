import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(254),
  password: z
    .string()
    .min(1, 'Password is required')
    .refine((value) => new TextEncoder().encode(value).length <= 72, 'Password exceeds 72 bytes'),
  rememberMe: z.boolean(),
})
