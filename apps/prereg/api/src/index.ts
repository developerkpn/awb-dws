import app from './app'
import { env } from './config/env'
import { prisma } from './config/prisma'

const server = app.listen(env.PORT, () => {
  console.log(`prereg-api listening on :${env.PORT}`)
})

const shutdown = () => {
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0))
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
