import type { prisma } from '../config/prisma'
import type { z } from 'zod'
import type {
  listDriverRequests,
  driverRequestBody,
  approveDriverRequestSchema,
  rejectDriverRequestSchema,
} from '../modules/driver-request/driver-request.schema'

export type DriverRequestListQuery = z.infer<typeof listDriverRequests>

export type DriverRequestBody = z.infer<typeof driverRequestBody>

export type DriverRequestApprovalInput = z.infer<typeof approveDriverRequestSchema>

export type DriverRequestRejectionInput = z.infer<typeof rejectDriverRequestSchema>

export interface DriverRequestDecisionInput {
  decision: 'APPROVED' | 'REJECTED'
  note?: string
  rejectionReason?: string
}

export interface DriverRequestIdentity {
  licenseNumber?: string
  plateNumber?: string
}

export type DriverRequestRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.driverRequest.findUnique>>
>
