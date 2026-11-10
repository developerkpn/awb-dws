import type repository from '../modules/internal-user/internal-user.repository'
import type { z } from 'zod'
import type { accountSchema } from '../modules/internal-user/internal-user.schema'

export type AccountData = {
  name: string
  username: string
  email: string | null
  phone: string | null
  accountType: string
  roleId: string
  city?: string | null
  country?: string | null
  plantIds: string[]
}

export type AccountInput = z.infer<typeof accountSchema>

export type InternalUserRecord = NonNullable<Awaited<ReturnType<typeof repository.findById>>>
