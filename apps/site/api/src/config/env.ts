import { z } from 'zod'
import { loadEnv } from '@awb/server-core'

export const env = loadEnv(
  z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().startsWith('sqlserver://', 'DATABASE_URL must be a SQL Server URL (sqlserver://...)'),
    SITE_ID: z.string().min(1).default('dev-site'),
    PREREG_API_URL: z.url().default('http://localhost:3000'),
    CONTROLLERS: z.string().default('[]'),
  }),
)
