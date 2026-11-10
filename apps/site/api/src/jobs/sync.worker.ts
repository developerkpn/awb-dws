import { env } from '../config/env'
import syncService from '../modules/sync/sync.service'

let timer: NodeJS.Timeout | null = null
let isRunning = false
let isPolling = false

async function tick() {
  if (!isRunning || isPolling) return

  isPolling = true

  try {
    await syncService.pullAndProcess()
  } catch (err) {
    console.error(
      '[sync-worker] Unexpected error during sync cycle:',
      err instanceof Error ? err.message : String(err),
    )
  } finally {
    isPolling = false

    if (isRunning) {
      timer = setTimeout(tick, env.SYNC_POLL_INTERVAL_MS)
    }
  }
}

export function startSyncWorker(options?: { immediate?: boolean }) {
  if (isRunning) return

  isRunning = true

  const interval = env.SYNC_POLL_INTERVAL_MS

  console.log(`[sync-worker] Started sync worker (interval: ${interval}ms, site: ${env.SITE_ID})`)

  if (options?.immediate) {
    void tick()
  } else {
    timer = setTimeout(tick, interval)
  }
}

export function stopSyncWorker() {
  if (!isRunning) return

  isRunning = false

  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  console.log('[sync-worker] Stopped sync worker')
}

export function isSyncWorkerRunning() {
  return isRunning
}
