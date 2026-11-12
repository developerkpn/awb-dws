import { env } from '../config/env'
import masterService from '../modules/master/master.service'

let timer: NodeJS.Timeout | null = null
let running = false

async function tick() {
  try {
    await masterService.pullAll()
  } finally {
    if (running) timer = setTimeout(tick, env.MASTER_PULL_INTERVAL_MINUTES * 60_000)
  }
}

/** Pulls the SAP masters on start and then every MASTER_PULL_INTERVAL_MINUTES. */
export function startMasterPullWorker() {
  if (running) return

  running = true
  console.log(`[master-pull] every ${env.MASTER_PULL_INTERVAL_MINUTES} min`)
  timer = setTimeout(tick, 5_000)
}

export function stopMasterPullWorker() {
  running = false

  if (timer) clearTimeout(timer)

  timer = null
}
