import app from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'
import authService from './modules/auth/auth.service'
import { startJulWorker } from './jobs/jul.worker'

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`prereg-api listening on :${env.PORT}`)
})

server.requestTimeout = 30_000
server.headersTimeout = 10_000
server.keepAliveTimeout = 5_000

const cleanup = setInterval(
  () => void authService.cleanup().catch(() => console.error('Authentication cleanup failed')),
  60_000,
)

cleanup.unref()
const stopJulWorker = startJulWorker()

const shutdown = () => {
  clearInterval(cleanup)
  stopJulWorker()

  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0))
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
