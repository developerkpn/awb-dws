import { z } from 'zod'
import {
  accountFilterSet,
  accountSelectionFilters,
  accountSortingQuery,
  DEFAULT_PAGE_SIZE,
} from '@awb/contracts'

export const INTERNAL_ROLES = ['ADMIN', 'LOGISTIC', 'COMMERCIAL'] as const
export const userIdParam = z.object({
  id: z.uuid(),
})

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null)

export const accountSchema = z
  .strictObject({
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
    city: z.string().trim().max(100).nullish(),
    country: z.string().trim().max(100).nullish(),
    accountType: z.enum(['INTERNAL', 'PARTNER']),
    role: z.enum([...INTERNAL_ROLES, 'CUSTOMER', 'VENDOR']),
    plantIds: z.array(z.uuid()).max(100).default([]),
  })
  .superRefine((value, ctx) => {
    const partnerRole = ['CUSTOMER', 'VENDOR', 'INTERCO'].includes(value.role)

    if ((value.accountType === 'PARTNER') !== partnerRole)
      ctx.addIssue({
        code: 'custom',
        path: ['role'],
        message: 'Role does not match account type',
      })

    if (new Set(value.plantIds).size !== value.plantIds.length)
      ctx.addIssue({
        code: 'custom',
        path: ['plantIds'],
        message: 'Duplicate selection',
      })
  })
export const updateStatusSchema = z.object({
  isActive: z.boolean(),
})
export const listUsersSchema = z.object({
  ...accountSelectionFilters.shape,
  ...accountSortingQuery.shape,
  filters: z
    .string()
    .max(12000)
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'Filters must contain valid JSON',
        })

        return z.NEVER
      }
    })
    .pipe(accountFilterSet)
    .optional(),
  q: z.string().trim().max(100).default(''),
  accountType: z.enum(['INTERNAL', 'PARTNER']).optional(),
  role: z.string().max(50).optional(),
  plantId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
})
