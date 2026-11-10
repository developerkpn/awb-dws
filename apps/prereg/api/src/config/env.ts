import { z } from 'zod'
import { loadEnv } from '@awb/server-core'

export const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default('127.0.0.1'),
    JUL_WORKER_ENABLED: z.enum(['true', 'false']).default('false'),
    SAP_ODATA_BASE_URL: z.url().default('http://erpdev-gm.gamasap.com:8000'),
    SAP_PO_API_URL: z.url().optional(),
    SAP_SERVICE_USERNAME: z.string().optional(),
    SAP_SERVICE_PASSWORD: z.string().optional(),
    SAP_ORACLE_CONNECT_STRING: z.string().optional(),
    SAP_ORACLE_USERNAME: z.string().optional(),
    SAP_ORACLE_PASSWORD: z.string().optional(),
    SAP_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(10000).default(8000),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
    UPLOAD_DIR: z.string().default('.data/uploads'),
    APP_ORIGIN: z.url().default('http://localhost:5173'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(14).default(12),
    SESSION_HOURS: z.coerce.number().int().min(1).max(24).default(8),
    SESSION_REMEMBER_DAYS: z.coerce.number().int().min(1).max(30).default(14),
    SESSION_IDLE_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
    ALLOW_LEGACY_PASSWORDS: z.enum(['true', 'false']).default('false'),
    INTERNAL_SERVICE_KEY: z
      .string()
      .min(16)
      .default('development-internal-service-secret-key-12345'),
    INTERNAL_SERVICE_KEYS: z
      .string()
      .default('{}')
      .transform((raw, ctx) => {
        try {
          const keys = z
            .record(z.string().min(1).max(100), z.string().min(32))
            .parse(JSON.parse(raw))

          if (new Set(Object.values(keys)).size !== Object.keys(keys).length)
            throw new Error('Repeated service keys')

          return keys
        } catch {
          ctx.addIssue({
            code: 'custom',
            message: 'Use a JSON object with unique service keys of at least 32 characters',
          })

          return z.NEVER
        }
      }),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
    DATABASE_URL: z
      .string()
      .regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a PostgreSQL URL (postgresql://...)'),
  })
  .superRefine((value, ctx) => {
    const url = new URL(value.SAP_ODATA_BASE_URL)

    if (url.username || url.password) {
      ctx.addIssue({
        code: 'custom',
        message: 'SAP_ODATA_BASE_URL must not contain embedded credentials',
        path: ['SAP_ODATA_BASE_URL'],
      })
    }

    if (value.NODE_ENV === 'production') {
      if (url.protocol !== 'https:' || !/^erpprd(?:[-.]|$)/i.test(url.hostname)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Production requires an HTTPS erpprd SAP OData origin',
          path: ['SAP_ODATA_BASE_URL'],
        })
      }

      if (value.SAP_ORACLE_USERNAME && /^sapbridge_d$/i.test(value.SAP_ORACLE_USERNAME)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Production cannot use the development SAPBRIDGE_D schema',
          path: ['SAP_ORACLE_USERNAME'],
        })
      }

      for (const field of [
        'SAP_SERVICE_USERNAME',
        'SAP_SERVICE_PASSWORD',
        'SAP_ORACLE_CONNECT_STRING',
        'SAP_ORACLE_USERNAME',
        'SAP_ORACLE_PASSWORD',
      ] as const) {
        if (!value[field])
          ctx.addIssue({
            code: 'custom',
            message: 'Required for production SAP integration',
            path: [field],
          })
      }
    } else {
      if (!['http:', 'https:'].includes(url.protocol) || !/^erpdev(?:[-.]|$)/i.test(url.hostname)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Development and test require an erpdev SAP OData origin',
          path: ['SAP_ODATA_BASE_URL'],
        })
      }

      if (value.SAP_ORACLE_USERNAME && /^sapbridge_p$/i.test(value.SAP_ORACLE_USERNAME)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Non-production cannot use the production SAPBRIDGE_P schema',
          path: ['SAP_ORACLE_USERNAME'],
        })
      }
    }

    if (
      value.NODE_ENV === 'production' &&
      (!Object.keys(value.INTERNAL_SERVICE_KEYS).length ||
        Object.values(value.INTERNAL_SERVICE_KEYS).some((key) => key.startsWith('development-')))
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Configure unique production service keys for each site',
        path: ['INTERNAL_SERVICE_KEYS'],
      })
    }

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
  })

export const env = loadEnv(environmentSchema)
