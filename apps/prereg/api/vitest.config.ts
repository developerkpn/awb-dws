import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: { BCRYPT_ROUNDS: '4', UPLOAD_DIR: '.data/test-uploads' },
    // Applies migrations to the *_test database from .env.test before any test runs.
    globalSetup: './tests/global-setup.ts',
    // One shared test database: run test files one at a time.
    fileParallelism: false,
  },
})
