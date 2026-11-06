import { z } from 'zod'
import { syncEnvelope } from './envelope'

export const driverVehicleApprovedPayload = z.object({
  requestId: z.uuid(),
  siteId: z.string(),
  driver: z.object({
    licenseNumber: z.string(),
    name: z.string(),
    address: z.string(),
    birthPlace: z.string(),
    birthDate: z.iso.datetime(),
    phone: z.string(),
    city: z.string().nullable().optional(),
    licensePhotoUrl: z.string().nullable().optional(),
    driverPhotoUrl: z.string().nullable().optional(),
  }),
  vehicle: z.object({
    plateNumber: z.string(),
    transporterId: z.uuid().nullable().optional(),
    transporterName: z.string().nullable().optional(),
    transporterCode: z.string().nullable().optional(),
    stnkPhotoUrl: z.string().nullable().optional(),
  }),
  approvedBy: z.uuid(),
  approvedAt: z.iso.datetime(),
})

export type DriverVehicleApprovedPayload = z.infer<typeof driverVehicleApprovedPayload>

export const driverVehicleApprovedEvent = syncEnvelope(driverVehicleApprovedPayload).extend({
  eventType: z.literal('driver_vehicle.approved'),
})

export type DriverVehicleApprovedEvent = z.infer<typeof driverVehicleApprovedEvent>
