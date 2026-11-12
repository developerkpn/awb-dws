import type { DriverVehicleApprovedEvent } from '@awb/contracts'
import { prisma } from '../../config/prisma'

// Rows from the prereg sync are kept apart from SAP rows; lookups ignore them for now (offline fallback).
const PREREG = 'PREREG'

export default {
  async getLastSequence(key = 'prereg_outbox'): Promise<number> {
    const state = await prisma.syncState.findUnique({
      where: { key },
    })

    if (state) return state.lastSequence

    const lastInbox = await prisma.syncInbox.findFirst({
      orderBy: { sequenceNumber: 'desc' },
    })

    return lastInbox?.sequenceNumber ?? 0
  },

  async hasProcessedEvent(eventId: string): Promise<boolean> {
    const inbox = await prisma.syncInbox.findUnique({
      where: { eventId },
    })

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

      const { driver, vehicle } = payload

      if (driver)
        await tx.driver.upsert({
          where: {
            licenseNumber_source: {
              licenseNumber: driver.licenseNumber,
              source: PREREG,
            },
          },
          create: {
            licenseNumber: driver.licenseNumber,
            source: PREREG,
            name: driver.name,
            address: driver.address,
            birthPlace: driver.birthPlace,
            birthDate: new Date(driver.birthDate),
            phone: driver.phone,
            city: driver.city ?? null,
            licensePhotoUrl: driver.licensePhotoUrl ?? null,
            driverPhotoUrl: driver.driverPhotoUrl ?? null,
            isActive: true,
          },
          update: {
            name: driver.name,
            address: driver.address,
            birthPlace: driver.birthPlace,
            birthDate: new Date(driver.birthDate),
            phone: driver.phone,
            city: driver.city ?? null,
            licensePhotoUrl: driver.licensePhotoUrl ?? null,
            driverPhotoUrl: driver.driverPhotoUrl ?? null,
            isActive: true,
          },
        })

      if (vehicle)
        await tx.vehicle.upsert({
          where: {
            plateNumber_source: {
              plateNumber: vehicle.plateNumber,
              source: PREREG,
            },
          },
          create: {
            plateNumber: vehicle.plateNumber,
            source: PREREG,
            transporterId: vehicle.transporterId ?? null,
            transporterName: vehicle.transporterName ?? null,
            transporterCode: vehicle.transporterCode ?? null,
            stnkPhotoUrl: vehicle.stnkPhotoUrl ?? null,
            isActive: true,
          },
          update: {
            transporterId: vehicle.transporterId ?? null,
            transporterName: vehicle.transporterName ?? null,
            transporterCode: vehicle.transporterCode ?? null,
            stnkPhotoUrl: vehicle.stnkPhotoUrl ?? null,
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
    return prisma.driver.findUnique({
      where: {
        licenseNumber_source: {
          licenseNumber,
          source: PREREG,
        },
      },
    })
  },

  async findVehicleByPlate(plateNumber: string) {
    return prisma.vehicle.findUnique({
      where: {
        plateNumber_source: {
          plateNumber,
          source: PREREG,
        },
      },
    })
  },

  async findInboxByEventId(eventId: string) {
    return prisma.syncInbox.findUnique({
      where: { eventId },
    })
  },

  async countInbox() {
    return prisma.syncInbox.count()
  },
}
