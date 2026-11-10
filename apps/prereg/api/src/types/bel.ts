import type { BelPoItem } from '@awb/contracts'
import type { Prisma } from '../generated/prisma/client'
import type { z } from 'zod'
import type { approveBody, belListQuery, draftBody, reasonBody } from '../modules/bel/bel.schema'

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

export type StoredBelRequest = NonNullable<
  Prisma.BelRegistrationGetPayload<{
    include: {
      vendor: { select: { id: true; name: true; username: true } }
      lines: {
        include: { document: { include: { plant: true } } }
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
      }
      history: {
        include: { actor: { select: { name: true; username: true } } }
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
      }
    }
  }>
>