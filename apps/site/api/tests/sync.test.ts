import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DriverVehicleApprovedEvent } from '@awb/contracts'
import app from '../src/app'
import { env } from '../src/config/env'
import { prisma } from '../src/config/prisma'
import syncService from '../src/modules/sync/sync.service'
import syncRepository from '../src/modules/sync/sync.repository'
import {
  startSyncWorker,
  stopSyncWorker,
  isSyncWorkerRunning,
} from '../src/modules/sync/sync.worker'

function createValidApprovedEvent(overrides?: {
  eventId?: string
  licenseNumber?: string
  plateNumber?: string
}): DriverVehicleApprovedEvent {
  const eventId = overrides?.eventId ?? randomUUID()
  const licenseNumber =
    overrides?.licenseNumber ?? `SIM-${Math.floor(100000 + Math.random() * 900000)}`
  const plateNumber = overrides?.plateNumber ?? `B ${Math.floor(1000 + Math.random() * 9000)} XYZ`
  const now = new Date().toISOString()
  const requestId = randomUUID()

  return {
    eventId,
    schemaVersion: 1,
    eventType: 'driver_vehicle.approved',
    aggregateId: requestId,
    aggregateVersion: 1,
    siteId: env.SITE_ID,
    source: 'ho',
    target: env.SITE_ID,
    occurredAt: now,
    recordedAt: now,
    payload: {
      requestId,
      siteId: env.SITE_ID,
      driver: {
        licenseNumber,
        name: 'Budi Santoso',
        address: 'Jl. Merdeka No. 45',
        birthPlace: 'Jakarta',
        birthDate: '1985-05-12T00:00:00.000Z',
        phone: '081234567890',
        city: 'Jakarta Timur',
        licensePhotoUrl: '/documents/sim/test-sim.jpg',
        driverPhotoUrl: '/documents/driver/test-driver.jpg',
      },
      vehicle: {
        plateNumber,
        transporterId: randomUUID(),
        transporterName: 'PT Logistics Maju',
        transporterCode: 'TR-001',
        stnkPhotoUrl: '/documents/stnk/test-stnk.jpg',
      },
      approvedBy: randomUUID(),
      approvedAt: now,
    },
  }
}

describe('Sync Domain (AWB-15)', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    stopSyncWorker()

    // Clean up tables
    await prisma.syncInbox.deleteMany()
    await prisma.syncState.deleteMany()
    await prisma.driver.deleteMany()
    await prisma.vehicle.deleteMany()
  })

  afterAll(async () => {
    stopSyncWorker()
    await prisma.$disconnect()
  })

  describe('1. Scheduled Worker', () => {
    it('protects manual synchronization with service authentication', async () => {
      expect((await request(app).post('/api/sync/pull')).status).toBe(401)
      expect((await request(app).post('/api/sync/pull').set('x-service-key', 'wrong')).status).toBe(
        401,
      )
    })
    it('starts, reports running status, and stops cleanly', () => {
      expect(isSyncWorkerRunning()).toBe(false)
      startSyncWorker()
      expect(isSyncWorkerRunning()).toBe(true)
      stopSyncWorker()
      expect(isSyncWorkerRunning()).toBe(false)
    })

    it('reports worker status via GET /api/sync/status', async () => {
      const res = await request(app).get('/api/sync/status')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toMatchObject({
        siteId: env.SITE_ID,
        lastSequence: 0,
        workerRunning: false,
      })
    })
  })

  describe('2. Contract Validation & Persistence', () => {
    it('validates incoming message with contract and persists driver and vehicle to SQL Server', async () => {
      const event = createValidApprovedEvent()
      const mockOutboxMessage = {
        id: 101,
        eventId: event.eventId,
        eventType: event.eventType,
        siteId: event.siteId,
        aggregateId: event.aggregateId,
        payload: event,
      }

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const urlStr = input.toString()
        if (urlStr.includes('/api/internal/sync/outbox')) {
          expect(init?.headers).toMatchObject({
            'x-service-key': env.INTERNAL_SERVICE_KEY,
          })
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                messages: [mockOutboxMessage],
                lastId: 101,
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (urlStr.includes('/api/internal/sync/ack')) {
          return new Response(JSON.stringify({ success: true, data: { count: 1 } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response('Not Found', { status: 404 })
      })

      const result = await syncService.pullAndProcess()
      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(1)
      expect(result.lastSequence).toBe(101)

      // Verify driver saved
      const driver = await syncRepository.findDriverByLicense(event.payload.driver.licenseNumber)
      expect(driver).not.toBeNull()
      expect(driver?.name).toBe('Budi Santoso')
      expect(driver?.phone).toBe('081234567890')
      expect(driver?.city).toBe('Jakarta Timur')
      expect(driver?.licensePhotoUrl).toBe('/documents/sim/test-sim.jpg')

      // Verify vehicle saved
      const vehicle = await syncRepository.findVehicleByPlate(event.payload.vehicle.plateNumber)
      expect(vehicle).not.toBeNull()
      expect(vehicle?.transporterName).toBe('PT Logistics Maju')
      expect(vehicle?.transporterCode).toBe('TR-001')
      expect(vehicle?.stnkPhotoUrl).toBe('/documents/stnk/test-stnk.jpg')

      // Verify inbox and state saved
      const inbox = await syncRepository.findInboxByEventId(event.eventId)
      expect(inbox).not.toBeNull()
      expect(inbox?.sequenceNumber).toBe(101)
      expect(await syncRepository.getLastSequence()).toBe(101)

      // Verify ACK was called
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/internal/sync/ack'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ upTo: 101, siteId: env.SITE_ID }),
        }),
      )
    })

    it('rejects messages that fail contract validation and does not save them', async () => {
      const invalidMessage = {
        id: 102,
        eventId: randomUUID(),
        eventType: 'driver_vehicle.approved',
        siteId: env.SITE_ID,
        aggregateId: randomUUID(),
        payload: {
          // Missing required fields from contract
          driver: { name: 'Incomplete Driver' },
        },
      }

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              messages: [invalidMessage],
              lastId: 102,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )

      const result = await syncService.pullAndProcess()
      expect(result.success).toBe(false)
      expect(result.processedCount).toBe(0)
      expect(result.lastSequence).toBe(0)
      expect(result.blockedSequence).toBe(102)

      // Nothing saved
      expect(await syncRepository.countInbox()).toBe(0)
      expect(await prisma.driver.count()).toBe(0)
    })
  })

  describe('3. Idempotency & Duplicate Handling', () => {
    it('ignores duplicate messages without throwing error or duplicating records', async () => {
      const event = createValidApprovedEvent()
      const mockOutboxMessage = {
        id: 201,
        eventId: event.eventId,
        eventType: event.eventType,
        siteId: event.siteId,
        aggregateId: event.aggregateId,
        payload: event,
      }

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const urlStr = input.toString()
        if (urlStr.includes('/api/internal/sync/outbox')) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                messages: [mockOutboxMessage],
                lastId: 201,
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      })

      // First pull: successfully processed
      const firstResult = await syncService.pullAndProcess()
      expect(firstResult.processedCount).toBe(1)
      expect(await syncRepository.countInbox()).toBe(1)
      expect(await prisma.driver.count()).toBe(1)
      expect(await prisma.vehicle.count()).toBe(1)

      // Second pull with the exact same message: duplicate ignored
      const secondResult = await syncService.pullAndProcess()
      expect(secondResult.success).toBe(true)
      expect(secondResult.processedCount).toBe(0) // 0 new processed
      expect(await syncRepository.countInbox()).toBe(1) // Still exactly 1
      expect(await prisma.driver.count()).toBe(1)
      expect(await prisma.vehicle.count()).toBe(1)
    })
  })

  describe('4. Fault Tolerance & Disconnection Resilience', () => {
    it('handles network failure gracefully without crashing and leaves database intact', async () => {
      // Pre-seed an existing message sequence
      const initialEvent = createValidApprovedEvent()
      await syncRepository.upsertDriverAndVehicleFromApprovedEvent({
        sequenceNumber: 50,
        event: initialEvent,
      })
      expect(await syncRepository.getLastSequence()).toBe(50)

      // Simulate connection drop: fetch throws network error
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed: ECONNREFUSED'))

      const result = await syncService.pullAndProcess()
      expect(result.success).toBe(false)
      expect(result.disconnected).toBe(true)
      expect(result.lastSequence).toBe(50)
      expect(result.error).toContain('ECONNREFUSED')

      // Database state remains untouched
      expect(await syncRepository.getLastSequence()).toBe(50)
      expect(await syncRepository.countInbox()).toBe(1)
    })

    it('resumes from last received sequence number once connection is restored', async () => {
      // Start with lastSequence = 50
      const initialEvent = createValidApprovedEvent()
      await syncRepository.upsertDriverAndVehicleFromApprovedEvent({
        sequenceNumber: 50,
        event: initialEvent,
      })

      // When reconnected, HO gives next messages starting after 50
      const nextEvent = createValidApprovedEvent()
      const mockOutboxMessage = {
        id: 51,
        eventId: nextEvent.eventId,
        eventType: nextEvent.eventType,
        siteId: nextEvent.siteId,
        aggregateId: nextEvent.aggregateId,
        payload: nextEvent,
      }

      let outboxUrl = ''
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const urlStr = input.toString()
        if (urlStr.includes('/api/internal/sync/outbox')) {
          outboxUrl = urlStr
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                messages: [mockOutboxMessage],
                lastId: 51,
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      })

      const resumeResult = await syncService.pullAndProcess()
      expect(resumeResult.success).toBe(true)
      expect(resumeResult.processedCount).toBe(1)
      expect(resumeResult.lastSequence).toBe(51)

      // Assert that request query parameter was after=50
      expect(outboxUrl).toContain('after=50')

      // Both events now stored
      expect(await syncRepository.countInbox()).toBe(2)
      expect(await syncRepository.getLastSequence()).toBe(51)
    })
  })
})
