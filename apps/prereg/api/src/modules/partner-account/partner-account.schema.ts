import { z } from 'zod'

export const partnerRoleEnum = z.enum(['CUSTOMER', 'VENDOR', 'INTERCO'])
export type PartnerRole = z.infer<typeof partnerRoleEnum>

export const createPartnerAccountSchema = z.object({
  role: partnerRoleEnum,
  sapCodes: z.array(z.string().trim().min(1, 'Kode SAP tidak boleh kosong')).min(1, 'Pilih minimal satu kode SAP mitra'),
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.string().trim().email('Format email tidak valid'),
  phone: z.string().trim().min(1, 'Nomor HP wajib diisi'),
})
export type CreatePartnerAccountInput = z.infer<typeof createPartnerAccountSchema>

export const updateStatusSchema = z.object({
  isActive: z.boolean(),
})
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})
export type IdParam = z.infer<typeof idParamSchema>

export const partnerQuerySchema = z.object({
  role: partnerRoleEnum.optional(),
  available: z.enum(['true', 'false']).optional(),
})
export type PartnerQuery = z.infer<typeof partnerQuerySchema>

