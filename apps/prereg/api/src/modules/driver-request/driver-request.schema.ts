import { z } from 'zod'

export const listDriverRequests = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    status: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'SENT_TO_PLANT']).optional(),
    cursorId: z.uuid().optional(),
    cursorAt: z.iso.datetime().optional(),
  })
  .refine((value) => Boolean(value.cursorId) === Boolean(value.cursorAt), {
    message: 'Supply both cursorId and cursorAt',
    path: ['cursorId'],
  })
