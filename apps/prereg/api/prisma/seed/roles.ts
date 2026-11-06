import { prisma } from '../../src/config/prisma'

export async function seedRoles() {
  console.log('📦 Seeding roles...')
  const retired = await prisma.role.findMany({
    where: { code: { in: ['MANAGER', 'KRANIWB', 'INTERCO'] } },
    select: { id: true, _count: { select: { users: true } } },
  })
  if (retired.some((role) => role._count.users > 0))
    throw new Error(
      'Reassign accounts from retired roles before reseeding; no accounts were removed',
    )
  await prisma.role.deleteMany({ where: { id: { in: retired.map((role) => role.id) } } })
  const rolesData = [
    {
      code: 'ADMIN',
      name: 'Administrator HO',
      description: 'Head Office Admin with full system access',
    },
    {
      code: 'LOGISTIC',
      name: 'Logistics Staff HO',
      description: 'Logistics coordinator across plant sites',
    },
    {
      code: 'COMMERCIAL',
      name: 'Commercial Staff',
      description: 'Commercial and sales operations',
    },
    {
      code: 'CUSTOMER',
      name: 'Customer Partner',
      description: 'Registered customer partner (SAP KUNNR)',
    },
    {
      code: 'VENDOR',
      name: 'Vendor Partner',
      description: 'Registered vendor partner (SAP LIFNR)',
    },
  ]

  const rolesByCode = new Map<string, string>()
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, isActive: true },
      create: { code: r.code, name: r.name, description: r.description },
    })
    rolesByCode.set(r.code, role.id)
  }
  console.log(`✅ Roles seeded (${rolesByCode.size} roles).`)
  return rolesByCode
}
