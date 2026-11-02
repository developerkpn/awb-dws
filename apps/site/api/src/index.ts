import app from './app'
import { env } from './config/env'
import { controllers } from './config/controllers'
import { prisma } from './config/prisma'
import { startControllers } from './devices'

const server = app.listen(env.PORT, () => {
  console.log(`site-api listening on :${env.PORT} (site ${env.SITE_ID}, ${controllers.length} controllers)`)
})

const stopControllers = startControllers(controllers, (event) => {
  // Hand events to the weighbridge domain once the controller protocol is mapped.
  console.log(`[controller ${event.controllerId}] ${event.type}`)
})

const shutdown = () => {
  stopControllers()
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0))
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
