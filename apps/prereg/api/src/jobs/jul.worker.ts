import { env } from '../config/env'
import service from '../modules/jul/jul.service'

export function startJulWorker() {
  if (env.JUL_WORKER_ENABLED !== 'true') return () => undefined

  let running = false

  const timer = setInterval(() => {
    if (running) return

    running = true

    void service
      .tick()
      .catch(() => console.error('JUL reconciliation failed'))
      .finally(() => {
        running = false
      })
  }, 30000)

  timer.unref()

  return () => clearInterval(timer)
}
