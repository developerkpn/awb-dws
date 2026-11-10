import type { z } from 'zod'
import type { journeyIdParam } from '../modules/journey/journey.schema'
import type { RegistrationOrigin, TransactionType } from '@awb/contracts'

export type Journey = {
  id: string
  siteId: string
  transactionType: TransactionType
  registrationOrigin: RegistrationOrigin
  currentStage: string
  status: string
}

export type JourneyIdParam = z.infer<typeof journeyIdParam>
