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
    APP_ORIGIN: z.url().default('http://localhost:5174'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(14).default(12),
    SESSION_HOURS: z.coerce.number().int().min(1).max(24).default(12),
    SESSION_REMEMBER_DAYS: z.coerce.number().int().min(1).max(30).default(14),
    SESSION_IDLE_MINUTES: z.coerce.number().int().min(5).max(1440).default(120),
    SAP_ODATA_BASE_URL: z.url().default('http://erpdev-gm.gamasap.com:8000'),
    SAP_SERVICE_USERNAME: z.string().optional(),
    SAP_SERVICE_PASSWORD: z.string().optional(),
    SAP_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(60000),
    SITE_WB_LOCATION: z.string().trim().max(10).optional(),
    MASTER_PULL_ENABLED: z.enum(['true', 'false']).default('false'),
    MASTER_PULL_INTERVAL_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  })
  .superRefine((value, ctx) => {
    const sapUrl = new URL(value.SAP_ODATA_BASE_URL)

    if (sapUrl.username || sapUrl.password) {
      ctx.addIssue({
        code: 'custom',
        message: 'SAP_ODATA_BASE_URL must not contain embedded credentials',
        path: ['SAP_ODATA_BASE_URL'],
      })
    }

    // Same rule as prereg: production reads erpprd over HTTPS, everything else reads erpdev.
    const sapHostAllowed =
      value.NODE_ENV === 'production'
        ? sapUrl.protocol === 'https:' && /^erpprd(?:[-.]|$)/i.test(sapUrl.hostname)
        : /^erpdev(?:[-.]|$)/i.test(sapUrl.hostname)

    if (!sapHostAllowed) {
      ctx.addIssue({
        code: 'custom',
        message:
          value.NODE_ENV === 'production'
            ? 'Production requires an HTTPS erpprd SAP OData origin'
            : 'Development and test require an erpdev SAP OData origin',
        path: ['SAP_ODATA_BASE_URL'],
      })
    }

    if (value.NODE_ENV !== 'test' && value.BCRYPT_ROUNDS < 10) {
      ctx.addIssue({
        code: 'custom',
        message: 'BCRYPT_ROUNDS must be at least 10',
        path: ['BCRYPT_ROUNDS'],
      })
    }

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
