import { z } from 'zod'

export const syncOutboxResponse = z.object({
  success: z.literal(true),
  data: z.object({
    messages: z
      .array(
        z.object({
          id: z.int().positive(),
          eventId: z.uuid(),
          eventType: z.string(),
          siteId: z.string(),
          aggregateId: z.string(),
          payload: z.unknown(),
        }),
      )
      .max(100),
    lastId: z.int().nonnegative(),
  }),
})
