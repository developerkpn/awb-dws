import type { RegistrationOrigin, TransactionType } from '@awb/contracts'

export type Journey = {
  id: string
  siteId: string
  transactionType: TransactionType
  registrationOrigin: RegistrationOrigin
  currentStage: string
  status: string
}

// Temporary in-memory store until the journey table exists; keep the method signatures.
const journeys = new Map<string, Journey>()

export default {
  async findById(id: string): Promise<Journey | null> {
    return journeys.get(id) ?? null
  },
}
