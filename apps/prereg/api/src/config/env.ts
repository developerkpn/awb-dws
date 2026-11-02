import { z } from 'zod'
import { loadEnv } from '@awb/server-core'

export const env = loadEnv(
  z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a PostgreSQL URL (postgresql://...)'),
  }),
)
