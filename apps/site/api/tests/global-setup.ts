import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

/** Applies pending migrations to the test database before the suite runs. Refuses any non-*_test database. */
export default function setup(): void {
  try {
    if (existsSync('.env.test')) process.loadEnvFile('.env.test')

    const url = process.env.DATABASE_URL ?? ''

    if (!/_test\b/.test(url)) {
      throw new Error(
        'Tests need .env.test with DATABASE_URL pointing at a *_test database (see .env.test.example).',
      )
    }

    // Run the Prisma CLI with Node itself: on Windows, npx is a .cmd file that execFileSync can't start.
    const prisma = createRequire(import.meta.url).resolve('prisma/build/index.js')

    execFileSync(process.execPath, [prisma, 'migrate', 'deploy'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })
  } catch (err) {
    // Vitest crashes while printing errors thrown here ("code.charCodeAt is not a function"), so print the cause first.
    console.error(`\nTest setup failed: ${err instanceof Error ? err.message : String(err)}\n`)
    throw err
  }
}
