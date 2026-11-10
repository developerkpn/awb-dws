import { z } from 'zod'

const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `Maximum ${max} characters`)

const document = (label: string) => z.string().min(1, `Upload the ${label}`)

// Lengths follow the SAP columns the request is sent to.
export const driverFormSchema = z.object({
  siteId: z.string().min(1, 'Plant is required'),
  driverName: required('Full name', 100),
  driverLicenseNumber: required('License number', 25),
  driverBirthPlace: required('Place of birth', 25),
  driverBirthDate: z.string().min(1, 'Date of birth is required'),
  driverPhone: required('Phone number', 30),
  driverCity: required('Home city', 25),
  driverAddress: required('Address', 50),
  driverAddress2: z.string().trim().max(50, 'Maximum 50 characters').optional(),
  driverAddress3: z.string().trim().max(50, 'Maximum 50 characters').optional(),
  driverLicensePhotoUrl: document('license photo'),
  driverPhotoUrl: document('driver photo'),
})

export const vehicleFormSchema = z.object({
  siteId: z.string().min(1, 'Plant is required'),
  vehiclePlateNumber: required('Plate number', 20),
  vehicleStnkPhotoUrl: document('STNK photo'),
})
