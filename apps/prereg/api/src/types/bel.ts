import type { BelPoItem } from '@awb/contracts'
import type { Prisma } from '../generated/prisma/client'
import type { z } from 'zod'
import type { approveBody, belListQuery, draftBody, reasonBody } from '../modules/bel/bel.schema'
import type { REQUEST_INCLUDE } from '../modules/bel/bel.repository'

export type DraftBody = z.infer<typeof draftBody>

export type ApprovalBody = z.infer<typeof approveBody>

export type ReasonBody = z.infer<typeof reasonBody>

export type BelListQuery = z.infer<typeof belListQuery>

export type Tx = Prisma.TransactionClient

export type BelScope = {
  vendorId?: string
  plantIds?: string[]
}

export type PreparedBelLine = {
  id?: string
  documentId: string
  documentSnapshot: BelPoItem
  driverLicenseNumber: string | null
  driverName: string | null
  vehiclePlateNumber: string | null
  quantity: string
  loadingDate: Date | null
  mediaTransport: string
  remark: string | null
}

export type StoredBelRequest = Prisma.BelRegistrationGetPayload<{ include: typeof REQUEST_INCLUDE }>
