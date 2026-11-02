import { z } from 'zod'

export const preRegistrationIdParam = z.object({ id: z.uuid() })
export type PreRegistrationIdParam = z.infer<typeof preRegistrationIdParam>
