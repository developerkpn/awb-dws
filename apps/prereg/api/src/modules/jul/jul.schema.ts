import { z } from 'zod'
import {
  julVariant,
  julTransportMode,
  julRequestStatus,
  julSortFields,
  paginationQuery,
  sortDirection,
} from '@awb/contracts'

export const idParam = z.object({
  id: z.uuid(),
})
export const customerQuery = z.object({
  customerId: z.uuid().optional(),
})
export const documentQuery = customerQuery.extend({
  reference: z.string().trim().min(1).max(30),
  sto: z.string().trim().min(1).max(30).optional(),
})
export const lookupQuery = customerQuery.extend({
  q: z.string().trim().min(2).max(50),
})
export const listQuery = paginationQuery.extend({
  sortBy: z.enum(julSortFields).default('createdAt'),
  sortDirection: sortDirection.default('desc'),
  status: julRequestStatus.optional(),
  search: z.string().trim().max(100).optional(),
})
export const positiveQuantity = z
  .string()
  .trim()
  .regex(/^\d{1,14}(?:\.\d{1,6})?$/)
  .refine((value) => Number(value) >= 1, 'Minimum quantity is 1')
export const draftBody = z.strictObject({
  customerId: z.uuid().optional(),
  isMulti: z.boolean().optional(),
  version: z.number().int().positive().optional(),
  lines: z
    .array(
      z.strictObject({
        id: z.uuid().optional(),
        documentId: z.uuid(),
        variant: julVariant,
        stoNumber: z.string().trim().min(1).max(30).optional(),
        driverLicenseNumber: z.string().trim().max(50).optional(),
        vehiclePlateNumber: z
          .string()
          .trim()
          .max(20)
          .transform((value) => value.toUpperCase())
          .optional(),
        quantity: positiveQuantity,
        loadingDate: z.iso.date().optional(),
        mediaTransport: julTransportMode,
        remark: z.string().trim().max(500).optional(),
      }),
    )
    .min(1)
    .max(50),
})
export const versionBody = z.strictObject({
  version: z.number().int().positive(),
})
export const reasonBody = versionBody.extend({
  reason: z.string().trim().min(3).max(500),
})
export const approvalBody = versionBody
  .extend({
    sapPassword: z.string().min(1).max(128).optional(),
    lines: z
      .array(
        z.strictObject({
          id: z.uuid(),
          factoryStorage: z.string().trim().min(1).max(20),
          otherStorage: z.string().trim().min(1).max(20),
          factoryValuation: z.string().trim().min(1).max(30),
          otherValuation: z.string().trim().min(1).max(30),
          factoryBatch: z.string().trim().min(1).max(40),
          otherBatch: z.string().trim().min(1).max(40),
        }),
      )
      .min(1)
      .max(50),
  })
  .refine(
    (value) => new Set(value.lines.map((line) => line.id)).size === value.lines.length,
    'Select each line once',
  )
export const holdBody = z.strictObject({
  documentId: z.uuid(),
  quantity: z.string().regex(/^\d{1,14}(?:\.\d{1,6})?$/),
  reason: z.string().trim().min(3).max(500),
})
export const retryBody = z.strictObject({
  sapPassword: z.string().min(1).max(128).optional(),
})
