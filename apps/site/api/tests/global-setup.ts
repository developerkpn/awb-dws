import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

/** Applies pending migrations to the test database before the suite runs. Refuses any non-*_test database. */
export default function setup(): void {
  if (existsSync('.env.test')) process.loadEnvFile('.env.test')
  const url = process.env.DATABASE_URL ?? ''
  if (!/_test\b/.test(url)) {
    throw new Error('Tests need .env.test with DATABASE_URL pointing at a *_test database (see .env.test.example).')
  }
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } })
}
