import { z } from 'zod'

export const sessionUser = z.object({
  id: z.uuid(),
  name: z.string(),
  username: z.string(),
  role: z.string(),
  accountType: z.enum(['INTERNAL', 'PARTNER']),
  permissions: z.array(z.string()),
})

export const accountChoice = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
})

export const accountProfile = z.object({
  id: z.uuid(),
  name: z.string(),
  username: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  accountType: z.enum(['INTERNAL', 'PARTNER']),
  role: z.string(),
  isActive: z.boolean(),
  plantAccess: z.array(accountChoice),
})

export type SessionUser = z.infer<typeof sessionUser>
export type AccountProfile = z.infer<typeof accountProfile>
export type AccountChoice = z.infer<typeof accountChoice>

export const accountListItem = accountProfile
  .omit({
    plantAccess: true,
    city: true,
    country: true,
  })
  .extend({
    roleName: z.string(),
    plantCount: z.number().int().nonnegative(),
    plantPreview: z.array(accountChoice).max(2),
  })
export type AccountListItem = z.infer<typeof accountListItem>
