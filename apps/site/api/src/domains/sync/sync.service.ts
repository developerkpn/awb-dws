import { driverVehicleApprovedEvent } from '@awb/contracts'
import { env } from '../../config/env'
import repository from './sync.repository'

interface SyncOutboxMessage {
  id: number
  eventId: string
  eventType: string
  siteId: string
  aggregateId: string
  payload: unknown
}

interface OutboxApiResponse {
  success: boolean
  data?: {
    messages: SyncOutboxMessage[]
    lastId: number
  }
  error?: string
}

export default {
  async pullAndProcess(options?: { siteId?: string; limit?: number }) {
    const siteId = options?.siteId ?? env.SITE_ID
    const limit = options?.limit ?? 50
    const currentSeq = await repository.getLastSequence()

    const url = new URL('/api/internal/sync/outbox', env.PREREG_API_URL)
    url.searchParams.set('after', String(currentSeq))
    url.searchParams.set('limit', String(limit))
    if (siteId) {
      url.searchParams.set('siteId', siteId)
    }

    let response: Response
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-service-key': env.INTERNAL_SERVICE_KEY,
        },
      })
    } catch (err) {
      console.warn(
        `[sync] Unable to connect to HO (${url.origin}): ${
          err instanceof Error ? err.message : String(err)
        }. Operating offline.`,
      )
      return {
        success: false,
        disconnected: true,
        error: err instanceof Error ? err.message : String(err),
        lastSequence: currentSeq,
        processedCount: 0,
      }
    }

    if (!response.ok) {
      console.warn(`[sync] HO returned HTTP ${response.status} from ${url.pathname}`)
      return {
        success: false,
        disconnected: false,
        status: response.status,
        lastSequence: currentSeq,
        processedCount: 0,
      }
    }

    const body = (await response.json()) as OutboxApiResponse
    const messages = body.data?.messages ?? []

    let processedCount = 0
    let highestSeq = currentSeq

    for (const msg of messages) {
      if (msg.eventType === 'driver_vehicle.approved') {
        const validation = driverVehicleApprovedEvent.safeParse(msg.payload)
        if (!validation.success) {
          console.warn(
            `[sync] Message #${msg.id} failed contract validation:`,
            validation.error.issues,
          )
          continue
        }

        const result = await repository.upsertDriverAndVehicleFromApprovedEvent({
          sequenceNumber: msg.id,
          event: validation.data,
        })

        if (result.applied) {
          processedCount += 1
        }
        highestSeq = Math.max(highestSeq, msg.id)
      } else {
        console.warn(`[sync] Skipping unknown eventType: ${msg.eventType} (message #${msg.id})`)
      }
    }

    if (highestSeq > currentSeq) {
      try {
        const ackUrl = new URL('/api/internal/sync/ack', env.PREREG_API_URL)
        await fetch(ackUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-service-key': env.INTERNAL_SERVICE_KEY,
          },
          body: JSON.stringify({
            upTo: highestSeq,
            siteId,
          }),
        })
      } catch (ackErr) {
        console.warn(
          `[sync] Failed to acknowledge messages up to #${highestSeq} to HO:`,
          ackErr instanceof Error ? ackErr.message : String(ackErr),
        )
      }
    }

    return {
      success: true,
      disconnected: false,
      processedCount,
      lastSequence: highestSeq,
      totalMessages: messages.length,
    }
  },

  async getStatus() {
    const lastSequence = await repository.getLastSequence()
    return {
      siteId: env.SITE_ID,
      lastSequence,
    }
  },
}
