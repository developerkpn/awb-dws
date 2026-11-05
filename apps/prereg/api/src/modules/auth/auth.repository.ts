import { prisma } from '../../config/prisma'

export type AuthUserWithPartners = {
  id: number
  name: string
  email: string
  phone: string
  role: string
  passwordHash: string
  isActive: boolean
  otpCode: string | null
  otpExpiresAt: Date | null
  passwordUpdatedAt: Date
  createdAt: Date
  updatedAt: Date
  partners: {
    partner: {
      id: number
      code: string
      name: string
      role: string
    }
  }[]
}

export default {
  async findUserByPartnerCode(code: string): Promise<AuthUserWithPartners | null> {
    return prisma.user.findFirst({
      where: {
        partners: {
          some: {
            partner: {
              code,
            },
          },
        },
      },
      include: {
        partners: {
          include: {
            partner: true,
          },
        },
      },
    })
  },

  async findUserByEmail(email: string): Promise<AuthUserWithPartners | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        partners: {
          include: {
            partner: true,
          },
        },
      },
    })
  },

  async findUserById(id: number): Promise<AuthUserWithPartners | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        partners: {
          include: {
            partner: true,
          },
        },
      },
    })
  },

  async saveUserOtp(id: number, otpCode: string, otpExpiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        otpCode,
        otpExpiresAt,
      },
    })
  },

  async updatePasswordAndClearOtp(id: number, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordUpdatedAt: new Date(),
        otpCode: null,
        otpExpiresAt: null,
      },
    })
  },
}
