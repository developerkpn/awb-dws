import type { TransactionType } from '@awb/contracts'

export type PreRegistration = {
  id: string
  siteId: string
  transactionType: TransactionType
  referenceDocument: string
  status: string
}

// Temporary in-memory store until the pre-registration table exists; keep the method signatures.
const preRegistrations = new Map<string, PreRegistration>()

export default {
  async findById(id: string): Promise<PreRegistration | null> {
    return preRegistrations.get(id) ?? null
  },
}
