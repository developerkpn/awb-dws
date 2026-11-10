import { z } from 'zod'
import { belRequestStatus, belSortFields, belTransportMode } from '@awb/contracts'
import { quantity } from '../../lib/quantity'

export const idParam = z.object({
  id: z.uuid(),
})

export const poItemQuery = z.object({
  vendorId: z.uuid().optional(),
})

export const lookupQuery = z.object({
  q: z.string().trim().max(50).optional(),
  vendorId: z.uuid().optional(),
})

export const belListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(belSortFields).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().max(80).optional(),
  status: belRequestStatus.optional(),
  vendorId: z.uuid().optional(),
})

export const positiveQuantity = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,6})?$/, 'Quantity must be a positive number with up to 6 decimals')
  .refine((value) => quantity(value) > 0n, 'Quantity must be positive')

const line = z.object({
  id: z.uuid().optional(),
  documentId: z.uuid(),
  driverLicenseNumber: z.string().trim().min(1).max(50).optional(),
  vehiclePlateNumber: z.string().trim().min(1).max(25).optional(),
  quantity: positiveQuantity,
  loadingDate: z.iso.date().optional(),
  mediaTransport: belTransportMode,
  remark: z.string().trim().max(500).optional(),
})

export const draftBody = z.object({
  vendorId: z.uuid().optional(),
  version: z.coerce.number().int().positive().optional(),
  lines: z.array(line).min(1).max(50),
})

export const versionBody = z.object({
  version: z.coerce.number().int().positive().optional(),
})

export const approveBody = z.object({
  version: z.coerce.number().int().positive().optional(),
})

export const reasonBody = z.object({
  version: z.coerce.number().int().positive().optional(),
  reason: z.string().trim().min(3).max(500),
})
