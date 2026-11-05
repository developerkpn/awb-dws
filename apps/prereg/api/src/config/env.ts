import { z } from 'zod'
import { loadEnv } from '@awb/server-core'

export const env = loadEnv(
  z
    .object({
      NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
      PORT: z.coerce.number().int().positive().default(3000),
      HOST: z.string().default('127.0.0.1'),
      DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
      UPLOAD_DIR: z.string().default('.data/uploads'),
      APP_ORIGIN: z.url().default('http://localhost:5173'),
      BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(14).default(12),
      SESSION_HOURS: z.coerce.number().int().min(1).max(24).default(8),
      SESSION_REMEMBER_DAYS: z.coerce.number().int().min(1).max(30).default(14),
      SESSION_IDLE_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
      ALLOW_LEGACY_PASSWORDS: z.enum(['true', 'false']).default('false'),
      TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
      DATABASE_URL: z
        .string()
        .regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a PostgreSQL URL (postgresql://...)'),
    })
    .superRefine((value, ctx) => {
      if (value.NODE_ENV !== 'test' && value.BCRYPT_ROUNDS < 10) {
        ctx.addIssue({
          code: 'custom',
          message: 'BCRYPT_ROUNDS must be at least 10',
          path: ['BCRYPT_ROUNDS'],
        })
      }
      if (value.NODE_ENV === 'production' && !value.APP_ORIGIN.startsWith('https://')) {
        ctx.addIssue({
          code: 'custom',
          message: 'Production APP_ORIGIN must use HTTPS',
          path: ['APP_ORIGIN'],
        })
      }
    }),
)
