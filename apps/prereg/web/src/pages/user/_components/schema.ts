import { z } from 'zod'

export const userFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(150),
    username: z
      .string()
      .trim()
      .min(3, 'Username must contain at least 3 characters')
      .max(100)
      .regex(/^[a-zA-Z0-9_.@-]+$/, 'Use letters, numbers, dots, underscores, @ or hyphens'),
    email: z.union([z.email().max(254), z.literal('')]),
    phone: z.string().trim().max(40),
    accountType: z.enum(['INTERNAL', 'PARTNER']),
    role: z.string().min(1, 'Choose a role'),
    partnerIds: z.array(z.uuid()).max(100),
    plantIds: z.array(z.uuid()).max(100),
  })
  .refine((value) => value.accountType !== 'PARTNER' || value.partnerIds.length > 0, {
    path: ['partnerIds'],
    message: 'Select at least one SAP partner',
  })
