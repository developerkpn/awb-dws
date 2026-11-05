import app from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'
import authService from './modules/auth/auth.service'

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

const shutdown = () => {
  clearInterval(cleanup)
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0))
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
