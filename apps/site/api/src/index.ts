import app from './app'
import { env } from './config/env'
import { controllers } from './config/controllers'
import { prisma } from './config/prisma'
import { startControllers } from './devices'
import { startMasterPullWorker, stopMasterPullWorker } from './jobs/master-pull.worker'
import { startSyncWorker, stopSyncWorker } from './jobs/sync.worker'

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(
    `site-api listening on :${env.PORT} (site ${env.SITE_ID}, ${controllers.length} controllers)`,
  )
})

if (env.SYNC_ENABLED !== 'false' && env.NODE_ENV !== 'test') {
  startSyncWorker()
}

if (env.MASTER_PULL_ENABLED === 'true' && env.NODE_ENV !== 'test') {
  startMasterPullWorker()
}

const stopControllers = startControllers(controllers, (event) => {
  // Hand events to the weighbridge domain once the controller protocol is mapped.
  console.log(`[controller ${event.controllerId}] ${event.type}`)
})

const shutdown = () => {
  stopSyncWorker()
  stopMasterPullWorker()
  stopControllers()

  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0))
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
