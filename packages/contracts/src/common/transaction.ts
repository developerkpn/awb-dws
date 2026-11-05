import { z } from 'zod'

/** Transaction types in scope (BRD D-01). Tolling and multi-DO are deferred (D-02). */
export const transactionType = z.enum(['BEL', 'JUL', 'LSK', 'LSM'])
export type TransactionType = z.infer<typeof transactionType>

/** How a truck was registered (PRD v0.3, "Jalur registrasi"). Set once, never changed by reconciliation. */
export const registrationOrigin = z.enum([
  'prereg_qr',
  'qr_fallback',
  'driver_entry',
  'ho_staff_entry',
])
export type RegistrationOrigin = z.infer<typeof registrationOrigin>
