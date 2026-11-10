import { expect, it } from 'vitest'
import { env, environmentSchema } from '../src/config/env'

it('requires unique, explicitly configured production credentials per site', () => {
  const input = {
    ...env,
    NODE_ENV: 'production',
    APP_ORIGIN: 'https://localhost',
    BCRYPT_ROUNDS: 12,
    SAP_ODATA_BASE_URL: 'https://erpprd-gm.gamasap.com:8443',
    SAP_SERVICE_USERNAME: 'service_user',
    SAP_SERVICE_PASSWORD: 'service_password',
    SAP_ORACLE_CONNECT_STRING: '172.22.3.94:1521/SAPBRIDGE',
    SAP_ORACLE_USERNAME: 'SAPBRIDGE_P',
    SAP_ORACLE_PASSWORD: 'oracle_password',
    INTERNAL_SERVICE_KEYS: '{}',
  }

  expect(environmentSchema.safeParse(input).success).toBe(false)

  expect(
    environmentSchema.safeParse({
      ...input,
      INTERNAL_SERVICE_KEYS: JSON.stringify({ SITE_A: 'development-' + 'x'.repeat(32) }),
    }).success,
  ).toBe(false)

  expect(
    environmentSchema.safeParse({
      ...input,
      INTERNAL_SERVICE_KEYS: JSON.stringify({
        SITE_A: 'a'.repeat(32),
        SITE_B: 'a'.repeat(32),
      }),
    }).success,
  ).toBe(false)

  expect(
    environmentSchema.safeParse({
      ...input,
      INTERNAL_SERVICE_KEYS: JSON.stringify({
        SITE_A: 'a'.repeat(32),
        SITE_B: 'b'.repeat(32),
      }),
    }).success,
  ).toBe(true)
})
