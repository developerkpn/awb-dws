import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(254),
  password: z
    .string()
    .min(1)
    .max(72)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password exceeds 72 bytes'),
  rememberMe: z.boolean().default(false),
})

export type { SessionUser } from '@awb/contracts'
