import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username atau Kode SAP wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  username: z.string().trim().min(1, 'Username, Kode SAP, atau Email wajib diisi'),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  username: z.string().trim().min(1, 'Username, Kode SAP, atau Email wajib diisi'),
  otp: z.string().trim().min(1, 'Kode OTP wajib diisi'),
})
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

