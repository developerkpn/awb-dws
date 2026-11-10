import { randomUUID } from 'node:crypto'
import { beforeEach, expect, it, vi } from 'vitest'
import { env } from '../src/config/env'
import repository from '../src/modules/sync/sync.repository'
import service from '../src/modules/sync/sync.service'

vi.mock('../src/modules/sync/sync.repository', () => ({
  default: {
    getLastSequence: vi.fn(),
    hasProcessedEvent: vi.fn(),
    upsertDriverAndVehicleFromApprovedEvent: vi.fn(),
  },
}))

function message(id: number, siteId = env.SITE_ID) {
  const requestId = randomUUID()
  const eventId = randomUUID()
  const timestamp = new Date().toISOString()

  return {
    id,
    eventId,
    eventType: 'driver_vehicle.approved',
    siteId,
    aggregateId: requestId,
    payload: {
      eventId,
      eventType: 'driver_vehicle.approved',
      schemaVersion: 1,
      aggregateId: requestId,
      aggregateVersion: 1,
      siteId,
      source: 'ho',
      target: siteId,
      occurredAt: timestamp,
      recordedAt: timestamp,
      payload: {
        requestId,
        siteId,
        driver: {
          licenseNumber: 'REVIEW-SIM',
          name: 'Review fixture',
          address: 'Fixture address',
          birthPlace: 'Fixture city',
          birthDate: '1990-01-01T00:00:00.000Z',
          phone: '0000000000',
        },
        vehicle: { plateNumber: 'REVIEW-PLATE' },
        approvedBy: randomUUID(),
        approvedAt: timestamp,
      },
    },
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(repository.getLastSequence).mockResolvedValue(0)
  vi.mocked(repository.upsertDriverAndVehicleFromApprovedEvent).mockResolvedValue({ applied: true })
})

it('does not acknowledge or advance past an invalid message followed by a valid message', async () => {
  const invalid = {
    ...message(1),
    payload: { invalid: true },
  }

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        success: true,
        data: {
          messages: [invalid, message(2)],
          lastId: 2,
        },
      }),
    )
    .mockResolvedValue(Response.json({ success: true }))

  vi.stubGlobal('fetch', fetchMock)

  const result = await service.pullAndProcess()

  expect(result.lastSequence).toBe(0)
  expect(repository.upsertDriverAndVehicleFromApprovedEvent).not.toHaveBeenCalled()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('refuses an event addressed to another site', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        data: {
          messages: [message(1, 'OTHER_SITE')],
          lastId: 1,
        },
      }),
    ),
  )

  await service.pullAndProcess()

  expect(repository.upsertDriverAndVehicleFromApprovedEvent).not.toHaveBeenCalled()
})

it('retries a failed acknowledgement after an empty poll without reapplying records', async () => {
  vi.mocked(repository.getLastSequence).mockResolvedValue(2)

  const empty = {
    success: true,
    data: {
      messages: [],
      lastId: 2,
    },
  }

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json(empty))
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(Response.json(empty))
    .mockResolvedValueOnce(Response.json({ success: true }))

  vi.stubGlobal('fetch', fetchMock)

  expect((await service.pullAndProcess()).ackPending).toBe(true)
  expect((await service.pullAndProcess()).success).toBe(true)
  expect(repository.upsertDriverAndVehicleFromApprovedEvent).not.toHaveBeenCalled()

  expect(fetchMock.mock.calls[3]?.[1]?.body).toBe(
    JSON.stringify({
      upTo: 2,
      siteId: env.SITE_ID,
    }),
  )
})

it('shares one polling cycle between simultaneous worker and manual pulls', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        success: true,
        data: {
          messages: [message(1)],
          lastId: 1,
        },
      }),
    )
    .mockResolvedValue(Response.json({ success: true }))

  vi.stubGlobal('fetch', fetchMock)

  const [first, second] = await Promise.all([service.pullAndProcess(), service.pullAndProcess()])

  expect(first).toBe(second)
  expect(first.success).toBe(true)
  expect(repository.upsertDriverAndVehicleFromApprovedEvent).toHaveBeenCalledTimes(1)
  expect(fetchMock).toHaveBeenCalledTimes(2)
})
