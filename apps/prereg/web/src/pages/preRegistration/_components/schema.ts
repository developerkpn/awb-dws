import { z } from 'zod'

export const driverRequestFormSchema = z.object({
  driverLicenseNumber: z
    .string()
    .trim()
    .min(1, 'Driver license number is required')
    .max(50, 'Maximum 50 characters'),
  driverName: z
    .string()
    .trim()
    .min(1, 'Driver full name is required')
    .max(200, 'Maximum 200 characters'),
  driverAddress: z.string().trim().min(1, 'Address is required').max(500, 'Maximum 500 characters'),
  driverBirthPlace: z
    .string()
    .trim()
    .min(1, 'Place of birth is required')
    .max(100, 'Maximum 100 characters'),
  driverBirthDate: z.string().min(1, 'Date of birth is required'),
  driverPhone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .max(30, 'Maximum 30 characters'),
  driverCity: z.string().trim().max(100, 'Maximum 100 characters').optional(),
  driverLicensePhotoUrl: z.string().trim().max(500).optional(),
  driverPhotoUrl: z.string().trim().max(500).optional(),
  vehiclePlateNumber: z
    .string()
    .trim()
    .min(1, 'License plate number is required')
    .max(20, 'Maximum 20 characters'),
  transporterId: z.uuid('Please select a valid transporter').optional().or(z.literal('')),
  vehicleStnkPhotoUrl: z.string().trim().max(500).optional(),
})

export type DriverRequestFormValues = z.infer<typeof driverRequestFormSchema>
