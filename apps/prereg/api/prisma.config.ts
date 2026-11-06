import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// Same env file rule as the app (@awb/server-core loadEnv): .env.test under NODE_ENV=test, otherwise .env.
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
if (existsSync(envFile)) process.loadEnvFile(envFile)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed/index.ts' },
  datasource: { url: process.env.DATABASE_URL },
})
