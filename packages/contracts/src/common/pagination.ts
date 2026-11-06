import { z } from 'zod'

export const DEFAULT_PAGE_SIZE = 20
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
})
