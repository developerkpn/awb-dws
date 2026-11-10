import type repository from '../modules/auth/auth.repository'

export type LoadedUser = NonNullable<Awaited<ReturnType<typeof repository.findUser>>>
