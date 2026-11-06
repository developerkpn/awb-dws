import { z } from 'zod'
import { driverRequestSortFields, sortDirection } from '@awb/contracts'

const documentReference = z
  .string()
  .regex(/^\/api\/documents\/[0-9a-f-]{36}$/i)
  .refine((value) => z.uuid().safeParse(value.split('/').at(-1)).success)
  .optional()

export const listDriverRequests = z
  .object({
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(driverRequestSortFields).default('createdAt'),
    sortDirection: sortDirection.default('desc'),
    status: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'SENT_TO_PLANT']).optional(),
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

export const driverRequestBody = z.strictObject({
  driverLicenseNumber: z.string().trim().min(1).max(50),
  driverName: z.string().trim().min(1).max(200),
  driverAddress: z.string().trim().min(1).max(500),
  driverBirthPlace: z.string().trim().min(1).max(100),
  driverBirthDate: z.iso.date(),
  driverPhone: z.string().trim().min(1).max(30),
  driverCity: z.string().trim().max(100).optional(),
  driverLicensePhotoUrl: documentReference,
  driverPhotoUrl: documentReference,
  vehiclePlateNumber: z.string().trim().min(1).max(20),
  transporterId: z.uuid().optional(),
  vehicleStnkPhotoUrl: documentReference,
})

export const approveDriverRequestSchema = z.object({
  siteId: z.string().trim().min(1).max(100).optional(),
})
