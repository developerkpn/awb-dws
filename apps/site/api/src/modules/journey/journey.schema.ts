import { z } from 'zod'

export const journeyIdParam = z.object({ id: z.uuid() })
export type JourneyIdParam = z.infer<typeof journeyIdParam>
