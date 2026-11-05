import { z } from 'zod'

export const INTERNAL_ROLES = ['ADMIN', 'MANAGER', 'LOGISTIC', 'COMMERCIAL', 'KRANIWB'] as const
export const userIdParam = z.object({ id: z.uuid() })
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null)
export const accountSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    username: z
      .string()
      .trim()
      .min(3)
      .max(100)
      .regex(/^[a-zA-Z0-9_.@-]+$/, 'Use letters, numbers, dots, underscores, @ or hyphens'),
    email: z
      .union([z.email().max(254), z.literal(''), z.null()])
      .optional()
      .transform((value) => value?.toLowerCase() || null),
    phone: optionalText(40),
    accountType: z.enum(['INTERNAL', 'PARTNER']),
    role: z.enum([...INTERNAL_ROLES, 'CUSTOMER', 'VENDOR', 'INTERCO']),
    plantIds: z.array(z.uuid()).max(100).default([]),
    partnerIds: z.array(z.uuid()).max(100).default([]),
  })
  .superRefine((value, ctx) => {
    const partnerRole = ['CUSTOMER', 'VENDOR', 'INTERCO'].includes(value.role)
    if ((value.accountType === 'PARTNER') !== partnerRole)
      ctx.addIssue({ code: 'custom', path: ['role'], message: 'Role does not match account type' })
    if (value.accountType === 'PARTNER' && !value.partnerIds.length)
      ctx.addIssue({
        code: 'custom',
        path: ['partnerIds'],
        message: 'Select at least one SAP partner',
      })
    if (value.accountType === 'INTERNAL' && value.partnerIds.length)
      ctx.addIssue({
        code: 'custom',
        path: ['partnerIds'],
        message: 'Internal accounts cannot link SAP partners',
      })
    for (const field of ['plantIds', 'partnerIds'] as const) {
      if (new Set(value[field]).size !== value[field].length)
        ctx.addIssue({ code: 'custom', path: [field], message: 'Duplicate selection' })
    }
  })
export type AccountInput = z.infer<typeof accountSchema>
export const updateStatusSchema = z.object({ isActive: z.boolean() })
export const listUsersSchema = z.object({
  q: z.string().trim().max(100).default(''),
  accountType: z.enum(['INTERNAL', 'PARTNER']).optional(),
  role: z.string().max(50).optional(),
  plantId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})
