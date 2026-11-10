import { z } from 'zod'
import { driverRequestSortFields, sortDirection } from '@awb/contracts'

const documentReference = z
  .string()
  .regex(/^\/api\/documents\/[0-9a-f-]{36}$/i)
  .refine((value) => z.uuid().safeParse(value.split('/').at(-1)).success)

export const listDriverRequests = z
  .object({
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(driverRequestSortFields).default('createdAt'),
    sortDirection: sortDirection.default('desc'),
    status: z
      .string()
      .trim()
      .transform((value) => [...new Set(value.split(',').map((item) => item.trim()))])
      .pipe(
        z
          .array(z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'SENT_TO_PLANT']))
          .min(1)
          .max(4),
      )
      .optional(),
    kind: z.enum(['DRIVER', 'VEHICLE']).optional(),
    siteId: z.string().trim().min(1).max(100).optional(),
    cursorId: z.uuid().optional(),
    cursorAt: z.iso.datetime().optional(),
  })
  .refine((value) => Boolean(value.cursorId) === Boolean(value.cursorAt), {
    message: 'Supply both cursorId and cursorAt',
    path: ['cursorId'],
  })
  .refine(
    (value) =>
      !value.cursorId ||
      (value.page === 1 && value.sortBy === 'createdAt' && value.sortDirection === 'desc'),
    {
      message: 'Cursor pagination requires page 1 and descending creation order',
      path: ['cursorId'],
    },
  )

// Field lengths follow the SAPBRIDGE DRIVER/TRUCK columns the request is staged into.
export const driverRequestBody = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('DRIVER'),
    siteId: z.string().trim().min(1).max(100),
    driverLicenseNumber: z.string().trim().min(1).max(25),
    driverName: z.string().trim().min(1).max(100),
    driverBirthPlace: z.string().trim().min(1).max(25),
    driverBirthDate: z.iso.date(),
    driverPhone: z.string().trim().min(1).max(30),
    driverCity: z.string().trim().min(1).max(25),
    driverAddress: z.string().trim().min(1).max(50),
    driverAddress2: z.string().trim().max(50).optional(),
    driverAddress3: z.string().trim().max(50).optional(),
    driverLicensePhotoUrl: documentReference,
    driverPhotoUrl: documentReference,
  }),
  z.strictObject({
    kind: z.literal('VEHICLE'),
    siteId: z.string().trim().min(1).max(100),
    vehiclePlateNumber: z.string().trim().min(1).max(20),
    vehicleStnkPhotoUrl: documentReference,
  }),
])

export const approveDriverRequestSchema = z.strictObject({
  note: z.string().trim().max(500).optional(),
})

export const rejectDriverRequestSchema = z.strictObject({
  rejectionReason: z.string().trim().min(1, 'Enter a rejection reason').max(500),
})
