import { randomInt } from 'node:crypto'
import { CustomError } from '@awb/server-core'
import { emailService } from '../../helpers/email'
import { generateStrongPassword, hashPassword, verifyPassword } from '../../helpers/password'
import { checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from '../../helpers/rate-limit'
import { signSession } from '../../helpers/session'
import authRepository, { type AuthUserWithPartners } from './auth.repository'
import type { ForgotPasswordInput, LoginInput, ResetPasswordInput } from './auth.schema'

export default {
  async login(input: LoginInput, clientKey: string) {
    checkLoginRateLimit(clientKey)

    // Lookup user: partner by SAP code first, otherwise by email
    let user = await authRepository.findUserByPartnerCode(input.username)
    if (!user) {
      user = await authRepository.findUserByEmail(input.username)
    }

    if (!user) {
      recordFailedLogin(clientKey)
      throw new CustomError('Username atau password salah', 401)
    }

    const isPasswordValid = verifyPassword(input.password, user.passwordHash)
    if (!isPasswordValid) {
      recordFailedLogin(clientKey)
      throw new CustomError('Username atau password salah', 401)
    }

    if (!user.isActive) {
      throw new CustomError('Akun Anda dinonaktifkan. Silakan hubungi admin.', 403)
    }

    resetLoginAttempts(clientKey)
    const sessionToken = signSession(user.id)

    return {
      sessionToken,
      user: this.formatUserProfile(user),
    }
  },

  async forgotPassword(input: ForgotPasswordInput) {
    let user = await authRepository.findUserByPartnerCode(input.username)
    if (!user) {
      user = await authRepository.findUserByEmail(input.username)
    }

    if (!user) {
      throw new CustomError('Pengguna dengan username atau email tersebut tidak ditemukan', 404)
    }

    if (!user.isActive) {
      throw new CustomError('Akun Anda dinonaktifkan. Silakan hubungi admin.', 403)
    }

    // Generate 6-digit numeric OTP
    const otp = randomInt(100000, 1000000).toString()
    const expiresInMinutes = 15
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

    await authRepository.saveUserOtp(user.id, otp, expiresAt)
    await emailService.sendOtpEmail(user.email, user.name, otp, expiresInMinutes)

    return {
      message: 'Kode OTP telah dikirim ke email terdaftar',
    }
  },

  async resetPassword(input: ResetPasswordInput) {
    let user = await authRepository.findUserByPartnerCode(input.username)
    if (!user) {
      user = await authRepository.findUserByEmail(input.username)
    }

    if (!user) {
      throw new CustomError('Pengguna dengan username atau email tersebut tidak ditemukan', 404)
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new CustomError('Permintaan OTP tidak ditemukan. Silakan minta kode OTP baru.', 400)
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      throw new CustomError('Kode OTP telah kedaluwarsa. Silakan minta kode OTP baru.', 400)
    }

    if (user.otpCode !== input.otp.trim()) {
      throw new CustomError('Kode OTP tidak valid.', 400)
    }

    const newPassword = generateStrongPassword(12)
    const newPasswordHash = hashPassword(newPassword)

    await authRepository.updatePasswordAndClearOtp(user.id, newPasswordHash)
    await emailService.sendPasswordReset(user.email, user.name, newPassword)

    return {
      message: 'Password baru telah dibuat dan dikirim ke email Anda',
    }
  },

  formatUserProfile(user: AuthUserWithPartners) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      partnerCodes: user.partners.map((p) => p.partner.code),
      partners: user.partners.map((p) => ({
        code: p.partner.code,
        name: p.partner.name,
        role: p.partner.role,
      })),
    }
  },
}

