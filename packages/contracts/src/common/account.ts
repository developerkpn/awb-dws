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

export const accountPartner = z.object({
  id: z.uuid(),
  sapCode: z.string(),
  name: z.string(),
  partnerType: z.string(),
})

export const accountProfile = z.object({
  id: z.uuid(),
  name: z.string(),
  username: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  accountType: z.enum(['INTERNAL', 'PARTNER']),
  role: z.string(),
  isActive: z.boolean(),
  plantAccess: z.array(accountChoice),
  partners: z.array(accountPartner),
})

export type SessionUser = z.infer<typeof sessionUser>
export type AccountProfile = z.infer<typeof accountProfile>
export type AccountChoice = z.infer<typeof accountChoice>
export type AccountPartner = z.infer<typeof accountPartner>
