import { PrismaMssql } from '@prisma/adapter-mssql'
import { PrismaClient } from '../generated/prisma/client'
import { env } from './env'

/** The one Prisma client (and SQL Server connection pool) for this process. Only repositories use it. */
export const prisma = new PrismaClient({ adapter: new PrismaMssql(env.DATABASE_URL) })
