import { z } from 'zod'

export const listDriverRequests = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    status: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'SENT_TO_PLANT']).optional(),
    cursorId: z.uuid().optional(),
    cursorAt: z.iso.datetime().optional(),
  })
  .refine((value) => Boolean(value.cursorId) === Boolean(value.cursorAt), {
    message: 'Supply both cursorId and cursorAt',
    path: ['cursorId'],
  })

export const driverRequestBody = z.object({
  driverLicenseNumber: z.string().trim().min(1).max(50),
  driverName: z.string().trim().min(1).max(200),
  driverAddress: z.string().trim().min(1).max(500),
  driverBirthPlace: z.string().trim().min(1).max(100),
  driverBirthDate: z.iso.date(),
  driverPhone: z.string().trim().min(1).max(30),
  driverCity: z.string().trim().max(100).optional(),
  driverLicensePhotoUrl: z.string().trim().max(500).optional(),
  driverPhotoUrl: z.string().trim().max(500).optional(),
  vehiclePlateNumber: z.string().trim().min(1).max(20),
  transporterId: z.uuid().optional(),
  vehicleStnkPhotoUrl: z.string().trim().max(500).optional(),
})
