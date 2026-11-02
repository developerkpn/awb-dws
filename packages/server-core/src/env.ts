import { existsSync } from 'node:fs'
import { z } from 'zod'

/** Loads .env (.env.test when NODE_ENV=test, so tests never touch the dev database) and validates it. */
export function loadEnv<S extends z.ZodType>(
  schema: S,
  file = process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
): z.output<S> {
  if (existsSync(file)) process.loadEnvFile(file)
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`)
  }
  return parsed.data
}
