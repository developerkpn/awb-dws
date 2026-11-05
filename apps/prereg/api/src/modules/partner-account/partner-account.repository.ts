import { prisma } from '../../config/prisma'

export type UserWithPartners = {
  id: number
  name: string
  email: string
  phone: string
  role: string
  isActive: boolean
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
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    })
  },

  async findUserById(id: number): Promise<UserWithPartners | null> {
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

  async findPartnersByCodes(codes: string[]) {
    return prisma.partner.findMany({
      where: { code: { in: codes } },
    })
  },

  async findAssignedPartnerCodes(codes: string[]): Promise<string[]> {
    const assignments = await prisma.userPartner.findMany({
      where: {
        partner: {
          code: { in: codes },
        },
      },
      include: {
        partner: true,
      },
    })
    return assignments.map((a) => a.partner.code)
  },

  async findPartners(role?: string, availableOnly = false) {
    return prisma.partner.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(availableOnly ? { userPartner: null } : {}),
      },
      orderBy: { code: 'asc' },
    })
  },

  async createUserWithPartners(data: {
    name: string
    email: string
    phone: string
    role: string
    passwordHash: string
    createdBy?: number
    partnerIds: number[]
  }): Promise<UserWithPartners> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        passwordHash: data.passwordHash,
        createdBy: data.createdBy,
        partners: {
          create: data.partnerIds.map((partnerId) => ({
            partnerId,
          })),
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

  async updateUserStatus(id: number, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      include: {
        partners: {
          include: {
            partner: true,
          },
        },
      },
    })
  },

  async updateUserPassword(id: number, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    })
  },

  async listPartnerAccounts(): Promise<UserWithPartners[]> {
    return prisma.user.findMany({
      where: {
        role: { in: ['CUSTOMER', 'VENDOR', 'INTERCO'] },
      },
      include: {
        partners: {
          include: {
            partner: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async upsertPartnerMaster(partner: { code: string; name: string; role: string }) {
    return prisma.partner.upsert({
      where: { code: partner.code },
      update: { name: partner.name, role: partner.role },
      create: partner,
    })
  },
}

