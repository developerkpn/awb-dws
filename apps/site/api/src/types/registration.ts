import type { registrationListQuery } from '@awb/contracts'
import type { z } from 'zod'
import type { Prisma } from '../generated/prisma/client'
import type { REGISTRATION_LIST_INCLUDE } from '../modules/registration/registration.repository'

export type RegistrationListFilter = z.output<typeof registrationListQuery>
export type ListedRegistration = Prisma.RegistrationGetPayload<{
  include: typeof REGISTRATION_LIST_INCLUDE
}>

export interface FlowPlacement {
  flowCode: string
  stageCode: string
}

export interface DecodedPhoto {
  mimeType: string
  content: Uint8Array<ArrayBuffer>
}
