import { z } from 'zod'

export const syncOutboxQuerySchema = z.object({
  after: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  siteId: z.string().trim().min(1).max(100).optional(),
})

export const syncAckSchema = z.object({
  upTo: z.coerce.number().int().min(1),
  siteId: z.string().trim().min(1).max(100).optional(),
})
