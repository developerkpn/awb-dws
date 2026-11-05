import { NotFoundError, ValidationError } from '@awb/server-core'
import { emailService } from '../../helpers/email'
import { generateStrongPassword, hashPassword } from '../../helpers/password'
import partnerAccountRepository from './partner-account.repository'
import type { CreatePartnerAccountInput } from './partner-account.schema'

export default {
  async createPartnerAccount(input: CreatePartnerAccountInput, createdBy?: number) {
    const existingUser = await partnerAccountRepository.findUserByEmail(input.email)
    if (existingUser) {
      throw new ValidationError({ email: ['Email sudah terdaftar'] }, 'Email sudah terdaftar')
    }

    const partners = await partnerAccountRepository.findPartnersByCodes(input.sapCodes)
    const foundCodes = new Set(partners.map((p) => p.code))
    const missingCodes = input.sapCodes.filter((code) => !foundCodes.has(code))
    if (missingCodes.length > 0) {
      throw new ValidationError(
        { sapCodes: [`Kode SAP tidak ditemukan di master: ${missingCodes.join(', ')}`] },
        'Kode SAP tidak valid',
      )
    }

    const wrongRolePartners = partners.filter((p) => p.role !== input.role)
    if (wrongRolePartners.length > 0) {
      throw new ValidationError(
        { sapCodes: [`Kode SAP tidak sesuai dengan peran ${input.role}: ${wrongRolePartners.map((p) => p.code).join(', ')}`] },
        'Peran kode SAP tidak cocok',
      )
    }

    const assignedCodes = await partnerAccountRepository.findAssignedPartnerCodes(input.sapCodes)
    if (assignedCodes.length > 0) {
      throw new ValidationError(
        { sapCodes: [`Kode SAP sudah digunakan oleh akun lain: ${assignedCodes.join(', ')}`] },
        'Kode SAP sudah digunakan',
      )
    }

    const rawPassword = generateStrongPassword(12)
    const passwordHash = hashPassword(rawPassword)

    const user = await partnerAccountRepository.createUserWithPartners({
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      passwordHash,
      createdBy,
      partnerIds: partners.map((p) => p.id),
    })

    await emailService.sendNewAccountCredentials(user.email, user.name, user.email, rawPassword, user.role)

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      partners: user.partners.map((p) => ({
        code: p.partner.code,
        name: p.partner.name,
        role: p.partner.role,
      })),
      createdAt: user.createdAt,
    }
  },

  async updateStatus(id: number, isActive: boolean) {
    const user = await partnerAccountRepository.findUserById(id)
    if (!user) throw new NotFoundError('Akun tidak ditemukan')

    const updated = await partnerAccountRepository.updateUserStatus(id, isActive)
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      isActive: updated.isActive,
      partners: updated.partners.map((p) => ({
        code: p.partner.code,
        name: p.partner.name,
        role: p.partner.role,
      })),
      updatedAt: updated.updatedAt,
    }
  },

  async resetPassword(id: number) {
    const user = await partnerAccountRepository.findUserById(id)
    if (!user) throw new NotFoundError('Akun tidak ditemukan')

    const newPassword = generateStrongPassword(12)
    const passwordHash = hashPassword(newPassword)

    await partnerAccountRepository.updateUserPassword(id, passwordHash)
    await emailService.sendPasswordReset(user.email, user.name, newPassword)

    return {
      message: 'Password baru berhasil dibuat dan dikirimkan ke email mitra',
    }
  },

  async getAvailablePartners(role?: string, availableOnly = true) {
    const partners = await partnerAccountRepository.findPartners(role, availableOnly)
    return partners.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      role: p.role,
    }))
  },

  async listAccounts() {
    const accounts = await partnerAccountRepository.listPartnerAccounts()
    return accounts.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      partners: user.partners.map((p) => ({
        code: p.partner.code,
        name: p.partner.name,
        role: p.partner.role,
      })),
      createdAt: user.createdAt,
    }))
  },
}

