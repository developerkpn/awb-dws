import { createHash } from 'node:crypto'
import { CustomError, NotFoundError } from '@awb/server-core'
import { generateSecurePassword, sendPasswordEmail } from '../../services/mailer'
import repository from './internal-user.repository'
import type {
  CreateInternalUserInput,
  LoginInput,
  UpdateInternalUserInput,
} from './internal-user.schema'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function formatUserResponse(u: any) {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    phone: u.phone,
    accountType: u.accountType,
    role: u.role?.code || u.roleId,
    roleName: u.role?.name,
    isActive: u.isActive,
    plantAccess: (u.plants || []).map((p: any) => ({
      id: p.plant?.id || p.plantId,
      code: p.plant?.code,
      name: p.plant?.name,
      city: p.plant?.city,
    })),
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}

export default {
  /**
   * List all internal users (ADMIN only)
   */
  async listInternalUsers() {
    const users = await repository.findAllInternal()
    return users.map(formatUserResponse)
  },

  /**
   * Get single user by ID (ADMIN only)
   */
  async getById(id: string) {
    const user = await repository.findById(id)
    if (!user || user.accountType !== 'INTERNAL') {
      throw new NotFoundError('Internal user not found')
    }
    return formatUserResponse(user)
  },

  /**
   * Create new internal user (ADMIN only)
   * System generates password and sends credentials to user's email
   */
  async createInternalUser(input: CreateInternalUserInput) {
    // 1. Check unique username
    const existingByUsername = await repository.findByUsername(input.username)
    if (existingByUsername) {
      throw new CustomError(`Username '${input.username}' is already in use`, 409)
    }

    // 2. Check unique email
    const existingByEmail = await repository.findByEmail(input.email)
    if (existingByEmail) {
      throw new CustomError(`Email '${input.email}' is already in use`, 409)
    }

    // 3. Resolve role
    const role = await repository.findRoleByCode(input.role)
    if (!role) {
      throw new CustomError(`Role '${input.role}' does not exist`, 400)
    }

    // 4. Validate plant IDs if provided
    if (input.plantIds && input.plantIds.length > 0) {
      const plants = await repository.findPlantsByIds(input.plantIds)
      if (plants.length !== input.plantIds.length) {
        throw new CustomError('One or more selected plant IDs are invalid', 400)
      }
    }

    // 5. Generate secure temporary password by system
    const tempPassword = generateSecurePassword(12)
    const passwordHash = hashPassword(tempPassword)

    // 6. Save in database
    const user = await repository.create({
      name: input.name,
      username: input.username,
      email: input.email,
      phone: input.phone,
      passwordHash,
      roleId: role.id,
      plantIds: input.plantIds,
    })

    // 7. Dispatch credentials to user's email
    await sendPasswordEmail(user.email!, user.username, tempPassword, false)

    return {
      user: formatUserResponse(user),
      temporaryPassword: tempPassword,
      message: `Internal account created. Credentials have been sent to ${user.email}.`,
    }
  },

  /**
   * Update internal user data (ADMIN only)
   */
  async updateInternalUser(id: string, input: UpdateInternalUserInput) {
    const existing = await repository.findById(id)
    if (!existing || existing.accountType !== 'INTERNAL') {
      throw new NotFoundError('Internal user not found')
    }

    let roleId: string | undefined
    if (input.role) {
      const role = await repository.findRoleByCode(input.role)
      if (!role) throw new CustomError(`Role '${input.role}' does not exist`, 400)
      roleId = role.id
    }

    if (input.email && input.email !== existing.email) {
      const emailTaken = await repository.findByEmail(input.email)
      if (emailTaken && emailTaken.id !== id) {
        throw new CustomError(`Email '${input.email}' is already in use`, 409)
      }
    }

    if (input.plantIds !== undefined && input.plantIds.length > 0) {
      const plants = await repository.findPlantsByIds(input.plantIds)
      if (plants.length !== input.plantIds.length) {
        throw new CustomError('One or more selected plant IDs are invalid', 400)
      }
    }

    const updated = await repository.update(id, {
      name: input.name,
      email: input.email,
      phone: input.phone,
      roleId,
      plantIds: input.plantIds,
    })

    return formatUserResponse(updated)
  },

  /**
   * Toggle Active / Deactivated status (ADMIN only)
   */
  async setStatus(id: string, isActive: boolean) {
    const existing = await repository.findById(id)
    if (!existing || existing.accountType !== 'INTERNAL') {
      throw new NotFoundError('Internal user not found')
    }

    const updated = await repository.updateStatus(id, isActive)
    return formatUserResponse(updated)
  },

  /**
   * Reset user password by Admin: new password is generated by system and dispatched to email
   */
  async resetPassword(id: string) {
    const user = await repository.findById(id)
    if (!user || user.accountType !== 'INTERNAL') {
      throw new NotFoundError('Internal user not found')
    }

    if (!user.email) {
      throw new CustomError('User does not have a registered email address for password delivery', 400)
    }

    // 1. Generate new password
    const newPassword = generateSecurePassword(12)
    const newPasswordHash = hashPassword(newPassword)

    // 2. Update hash in database
    await repository.updatePassword(id, newPasswordHash)

    // 3. Send email to user
    await sendPasswordEmail(user.email, user.username, newPassword, true)

    return {
      message: `Password reset successfully. New password sent to ${user.email}.`,
      temporaryPassword: newPassword,
    }
  },

  /**
   * Login Authentication
   * Rejects if account is inactive (Checklist 3: Akun nonaktif tidak bisa login)
   */
  async login(input: LoginInput) {
    const user = await repository.findByUsername(input.username)
    if (!user) {
      throw new CustomError('Invalid username or password', 401)
    }

    // Verification check for inactive account
    if (!user.isActive) {
      throw new CustomError('Account is inactive and cannot log in. Please contact administrator.', 403)
    }

    const inputHash = hashPassword(input.password)
    if (user.passwordHash !== inputHash) {
      throw new CustomError('Invalid username or password', 401)
    }

    return {
      user: formatUserResponse(user),
      token: `auth-token-${user.id}-${Date.now()}`,
    }
  },
}
