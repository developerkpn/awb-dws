import { z } from 'zod'
import { transactionType } from '../common/transaction'
import { syncEnvelope } from './envelope'

export const preregApprovedPayload = z.object({
  preregGlobalId: z.string(),
  documentVersion: z.number().int().positive(),
  siteId: z.string(),
  transactionType,
  referenceDocument: z.string(),
  approvalReference: z.string(),
  approvedAt: z.iso.datetime(),
})

export const preregApprovedEvent = syncEnvelope(preregApprovedPayload).extend({
  eventType: z.literal('prereg.approved'),
})
export type PreregApprovedEvent = z.infer<typeof preregApprovedEvent>
