import { z } from 'zod'
import { loadEnv } from '@awb/server-core'

export const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().default('127.0.0.1'),
    DATABASE_URL: z
      .string()
      .startsWith('sqlserver://', 'DATABASE_URL must be a SQL Server URL (sqlserver://...)'),
    SITE_ID: z.string().min(1).default('dev-site'),
    PREREG_API_URL: z.url().default('http://localhost:3000'),
    INTERNAL_SERVICE_KEY: z
      .string()
      .min(32)
      .default('development-internal-service-secret-key-12345'),
    SYNC_POLL_INTERVAL_MS: z.coerce.number().int().min(1000).default(60000),
    SYNC_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
    SYNC_ENABLED: z.enum(['true', 'false']).default('false'),
    CONTROLLERS: z.string().default('[]'),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && value.INTERNAL_SERVICE_KEY.startsWith('development-')) {
      ctx.addIssue({
        code: 'custom',
        message: 'Configure a production service key',
        path: ['INTERNAL_SERVICE_KEY'],
      })
    }
    if (
      value.NODE_ENV === 'production' &&
      value.SYNC_ENABLED === 'true' &&
      (!value.PREREG_API_URL.startsWith('https://') || value.SITE_ID === 'dev-site')
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Production synchronization needs an HTTPS HO URL and explicit site identity',
        path: ['PREREG_API_URL'],
      })
    }
  })

export const env = loadEnv(environmentSchema)
