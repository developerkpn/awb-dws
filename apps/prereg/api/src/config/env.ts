import { z } from 'zod'
import { loadEnv } from '@awb/server-core'

export const env = loadEnv(
  z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a PostgreSQL URL (postgresql://...)'),
    SESSION_SECRET: z.string().default('awb-dev-session-secret-key-32-chars-min'),
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().int().default(587),
    SMTP_USER: z.string().default(''),
    SMTP_PASS: z.string().default(''),
    SMTP_FROM: z.string().default('no-reply@kpn-corp.com'),
    SMTP_SECURE: z.coerce.boolean().default(false),
    UPLOAD_DIR: z.string().default('uploads'),
  }),
)
