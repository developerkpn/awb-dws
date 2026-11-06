import type { DriverVehicleApprovedEvent } from '@awb/contracts'
import { prisma } from '../../config/prisma'

export default {
  async getLastSequence(key = 'prereg_outbox'): Promise<number> {
    const state = await prisma.syncState.findUnique({ where: { key } })
    if (state) return state.lastSequence

    const lastInbox = await prisma.syncInbox.findFirst({
      orderBy: { sequenceNumber: 'desc' },
    })
    return lastInbox?.sequenceNumber ?? 0
  },

  async hasProcessedEvent(eventId: string): Promise<boolean> {
    const inbox = await prisma.syncInbox.findUnique({ where: { eventId } })
    return inbox !== null
  },

  async upsertDriverAndVehicleFromApprovedEvent(params: {
    sequenceNumber: number
    event: DriverVehicleApprovedEvent
  }): Promise<{ applied: boolean }> {
    const { sequenceNumber, event } = params
    const { payload } = event

    return prisma.$transaction(async (tx) => {
      const existing = await tx.syncInbox.findUnique({
        where: { eventId: event.eventId },
      })
      if (existing) {
        if (existing.sequenceNumber !== sequenceNumber) throw new Error('Event sequence mismatch')
        return { applied: false }
      }

      await tx.driver.upsert({
        where: { licenseNumber: payload.driver.licenseNumber },
        create: {
          licenseNumber: payload.driver.licenseNumber,
          name: payload.driver.name,
          address: payload.driver.address,
          birthPlace: payload.driver.birthPlace,
          birthDate: new Date(payload.driver.birthDate),
          phone: payload.driver.phone,
          city: payload.driver.city ?? null,
          licensePhotoUrl: payload.driver.licensePhotoUrl ?? null,
          driverPhotoUrl: payload.driver.driverPhotoUrl ?? null,
          isActive: true,
        },
        update: {
          name: payload.driver.name,
          address: payload.driver.address,
          birthPlace: payload.driver.birthPlace,
          birthDate: new Date(payload.driver.birthDate),
          phone: payload.driver.phone,
          city: payload.driver.city ?? null,
          licensePhotoUrl: payload.driver.licensePhotoUrl ?? null,
          driverPhotoUrl: payload.driver.driverPhotoUrl ?? null,
          isActive: true,
        },
      })

      await tx.vehicle.upsert({
        where: { plateNumber: payload.vehicle.plateNumber },
        create: {
          plateNumber: payload.vehicle.plateNumber,
          transporterId: payload.vehicle.transporterId ?? null,
          transporterName: payload.vehicle.transporterName ?? null,
          transporterCode: payload.vehicle.transporterCode ?? null,
          stnkPhotoUrl: payload.vehicle.stnkPhotoUrl ?? null,
          isActive: true,
        },
        update: {
          transporterId: payload.vehicle.transporterId ?? null,
          transporterName: payload.vehicle.transporterName ?? null,
          transporterCode: payload.vehicle.transporterCode ?? null,
          stnkPhotoUrl: payload.vehicle.stnkPhotoUrl ?? null,
          isActive: true,
        },
      })

      await tx.syncInbox.create({
        data: {
          sequenceNumber,
          eventId: event.eventId,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          payload: JSON.stringify(event),
        },
      })

      const currentState = await tx.syncState.findUnique({
        where: { key: 'prereg_outbox' },
      })
      const nextSequence = Math.max(currentState?.lastSequence ?? 0, sequenceNumber)

      await tx.syncState.upsert({
        where: { key: 'prereg_outbox' },
        create: {
          key: 'prereg_outbox',
          lastSequence: nextSequence,
        },
        update: {
          lastSequence: nextSequence,
        },
      })

      return { applied: true }
    })
  },

  async findDriverByLicense(licenseNumber: string) {
    return prisma.driver.findUnique({ where: { licenseNumber } })
  },

  async findVehicleByPlate(plateNumber: string) {
    return prisma.vehicle.findUnique({ where: { plateNumber } })
  },

  async findInboxByEventId(eventId: string) {
    return prisma.syncInbox.findUnique({ where: { eventId } })
  },

  async countInbox() {
    return prisma.syncInbox.count()
  },
}
