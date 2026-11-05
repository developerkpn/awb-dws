import { z } from 'zod'

export const syncEnvelope = <T extends z.ZodType>(payload: T) =>
  z.object({
    eventId: z.uuid(),
    schemaVersion: z.int().positive(),
    eventType: z.string(),
    aggregateId: z.string(),
    aggregateVersion: z.int().nonnegative(),
    siteId: z.string(),
    source: z.string(),
    target: z.string(),
    occurredAt: z.iso.datetime(),
    recordedAt: z.iso.datetime(),
    correlationId: z.string().optional(),
    payload,
  })
