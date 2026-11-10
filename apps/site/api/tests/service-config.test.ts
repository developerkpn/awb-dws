import { expect, it } from 'vitest'
import { env, environmentSchema } from '../src/config/env'

it('rejects development credentials in production and requires an explicit secure sync target', () => {
  const input = {
    ...env,
    NODE_ENV: 'production',
  }

  expect(environmentSchema.safeParse(input).success).toBe(false)

  const configured = {
    ...input,
    INTERNAL_SERVICE_KEY: 'a'.repeat(32),
    SYNC_ENABLED: 'true',
  }

  expect(environmentSchema.safeParse(configured).success).toBe(false)

  expect(
    environmentSchema.safeParse({
      ...configured,
      PREREG_API_URL: 'https://localhost',
      SITE_ID: 'SITE_A',
    }).success,
  ).toBe(true)
})
