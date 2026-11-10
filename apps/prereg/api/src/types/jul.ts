import type { JulDocument } from '@awb/contracts'
import type { Prisma } from '../generated/prisma/client'
import type { z } from 'zod'
import type { draftBody, approvalBody, listQuery } from '../modules/jul/jul.schema'
import type repository from '../modules/jul/jul.repository'

export type DraftBody = z.infer<typeof draftBody>

export type ApprovalBody = z.infer<typeof approvalBody>

export type JulListQuery = z.infer<typeof listQuery>

export type Tx = Prisma.TransactionClient

export type JulScope = { customerId?: string; plantIds?: string[] }

export type PreparedLine = {
  id?: string
  documentId: string
  documentSnapshot: JulDocument
  variant: string
  stoNumber: string | null
  driverLicenseNumber: string | null
  driverName: string | null
  vehiclePlateNumber: string | null
  quantity: string
  loadingDate: Date | null
  mediaTransport: string
  remark: string | null
}

export type StoredRequest = NonNullable<Awaited<ReturnType<typeof repository.find>>>
