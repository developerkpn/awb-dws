import { z } from 'zod'
import { driverVehicleApprovedEvent } from '@awb/contracts'
import { env } from '../../config/env'
import repository from './sync.repository'

import { syncOutboxResponse as outboxResponse } from './sync.schema'

interface PullResult {
  success: boolean
  disconnected: boolean
  processedCount: number
  lastSequence: number
  totalMessages?: number
  error?: string
  ackPending?: boolean
  blockedSequence?: number
  status?: number
}

let activePull: Promise<PullResult> | undefined

async function performPull(limit: number): Promise<PullResult> {
  const siteId = env.SITE_ID
  const currentSeq = await repository.getLastSequence()
  const url = new URL('/api/internal/sync/outbox', env.PREREG_API_URL)
  url.searchParams.set('after', String(currentSeq))
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('siteId', siteId)

  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: { 'x-service-key': env.INTERNAL_SERVICE_KEY },
      signal: AbortSignal.timeout(env.SYNC_REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    return {
      success: false,
      disconnected: true,
      processedCount: 0,
      lastSequence: currentSeq,
      error: error instanceof Error ? error.message : 'Unable to reach HO',
    }
  }

  if (!response.ok) {
    return {
      success: false,
      disconnected: false,
      status: response.status,
      processedCount: 0,
      lastSequence: currentSeq,
    }
  }

  let body: z.infer<typeof outboxResponse>
  try {
    body = outboxResponse.parse(await response.json())
  } catch {
    return {
      success: false,
      disconnected: false,
      error: 'Invalid outbox response',
      processedCount: 0,
      lastSequence: currentSeq,
    }
  }

  let processedCount = 0
  let highestSeq = currentSeq
  let previousId = 0
  let blockedSequence: number | undefined

  for (const message of body.data.messages) {
    const parsed = driverVehicleApprovedEvent.safeParse(message.payload)
    if (!parsed.success) {
      blockedSequence = message.id
      break
    }

    const event = parsed.data
    if (
      message.id <= previousId ||
      message.eventType !== event.eventType ||
      message.eventId !== event.eventId ||
      message.aggregateId !== event.aggregateId ||
      message.siteId !== siteId ||
      event.siteId !== siteId ||
      event.target !== siteId ||
      event.source !== 'ho' ||
      event.schemaVersion !== 1 ||
      event.payload.siteId !== siteId ||
      event.payload.requestId !== event.aggregateId
    ) {
      blockedSequence = message.id
      break
    }

    previousId = message.id
    try {
      if (message.id <= currentSeq && !(await repository.hasProcessedEvent(event.eventId))) {
        blockedSequence = message.id
        break
      }

      const result = await repository.upsertDriverAndVehicleFromApprovedEvent({
        sequenceNumber: message.id,
        event,
      })
      if (result.applied) processedCount++
      highestSeq = Math.max(highestSeq, message.id)
    } catch {
      blockedSequence = message.id
      break
    }
  }

  let ackPending = false
  // Retry the durable watermark even after an empty poll or a previously lost acknowledgement.
  if (highestSeq > 0) {
    try {
      const ack = await fetch(new URL('/api/internal/sync/ack', env.PREREG_API_URL).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-service-key': env.INTERNAL_SERVICE_KEY },
        body: JSON.stringify({ upTo: highestSeq, siteId }),
        signal: AbortSignal.timeout(env.SYNC_REQUEST_TIMEOUT_MS),
      })
      ackPending = !ack.ok
    } catch {
      ackPending = true
    }
  }

  return {
    success: blockedSequence === undefined && !ackPending,
    disconnected: false,
    processedCount,
    lastSequence: highestSeq,
    totalMessages: body.data.messages.length,
    ...(blockedSequence === undefined ? {} : { blockedSequence }),
    ...(ackPending ? { ackPending: true } : {}),
  }
}

export default {
  pullAndProcess(options?: { siteId?: string; limit?: number }) {
    if (options?.siteId && options.siteId !== env.SITE_ID) {
      throw new Error('Synchronization is restricted to the configured site')
    }
    const limit = z
      .int()
      .min(1)
      .max(100)
      .parse(options?.limit ?? 50)
    activePull ??= performPull(limit).finally(() => {
      activePull = undefined
    })
    return activePull
  },

  async getStatus() {
    return { siteId: env.SITE_ID, lastSequence: await repository.getLastSequence() }
  },
}
