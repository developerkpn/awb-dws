import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { env } from './env'

// Avoid Windows IPv6 (::1) ECONNREFUSED when Docker binds 127.0.0.1 only
const connectionString = env.DATABASE_URL.replace('@localhost:', '@127.0.0.1:')

/** The one Prisma client (and PostgreSQL connection pool) for this process. Only repositories use it. */
export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    max: env.DATABASE_POOL_MAX,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  }),
})
