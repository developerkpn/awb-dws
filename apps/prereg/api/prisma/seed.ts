import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import XLSX from 'xlsx'
import { prisma } from '../src/config/prisma'
import { env } from '../src/config/env'
import { generatePassword, hashPassword } from '../src/lib/password'
import { deliverCredentials } from '../src/services/mailer'
import { permissionCatalogue } from '../src/modules/role-permission/permissions'
import { seedCitiesAndTransporters } from './seed-master'

async function main() {
  if (env.NODE_ENV !== 'development')
    throw new Error('Development seed is disabled outside development')
  await seedCitiesAndTransporters()
  console.log('🌱 Starting database seeding for @awb/prereg-api...')

  // =========================================================================
  // 1. Seed Roles (Acceptance Checklist: CUSTOMER, VENDOR, LOGISTIC, COMMERCIAL, ADMIN + MANAGER, KRANIWB)
  // =========================================================================
  console.log('📦 Seeding roles...')
  const rolesData = [
    {
      code: 'ADMIN',
      name: 'Administrator HO',
      description: 'Head Office Admin with full system access',
    },
    {
      code: 'MANAGER',
      name: 'Plant Manager',
      description: 'Plant Manager with operational approval rights',
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
      code: 'KRANIWB',
      name: 'Krani Weighbridge',
      description: 'Weighbridge and scale operator at site',
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
    { code: 'INTERCO', name: 'Intercompany Partner', description: 'Intercompany partner' },
  ]

  const rolesByCode = new Map<string, string>()
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: { code: r.code, name: r.name, description: r.description },
    })
    rolesByCode.set(r.code, role.id)
  }
  console.log(`✅ Roles seeded (${rolesByCode.size} roles).`)

  // =========================================================================
  // 2. Seed Permissions & Role Permissions
  // =========================================================================
  console.log('🔐 Seeding permissions...')
  const permissionsData = permissionCatalogue.map(([code, name, module]) => ({
    code,
    name,
    module,
  }))

  const permissionsByCode = new Map<string, string>()
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, module: p.module },
      create: { code: p.code, name: p.name, module: p.module },
    })
    permissionsByCode.set(p.code, perm.id)
  }

  // Assign all permissions to ADMIN
  const adminRoleId = rolesByCode.get('ADMIN')!
  for (const permId of permissionsByCode.values()) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRoleId,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: adminRoleId,
        permissionId: permId,
      },
    })
  }
  console.log('✅ Permissions and role mappings seeded.')

  // =========================================================================
  // 3. Seed Plants
  // =========================================================================
  console.log('🏭 Seeding plants...')
  const plantsData = [
    { code: 'PRISCOLIN_KARAWANG', name: 'Priscolin Karawang', city: 'Karawang' },
    { code: 'DUMAI', name: 'Dumai Plant', city: 'Dumai' },
    { code: 'MEDAN', name: 'Medan Plant', city: 'Medan' },
    { code: 'JAKARTA_HO', name: 'Jakarta Head Office', city: 'Jakarta' },
  ]

  const plantsByCode = new Map<string, string>()
  for (const pl of plantsData) {
    const plant = await prisma.plant.upsert({
      where: { code: pl.code },
      update: { name: pl.name, city: pl.city },
      create: { code: pl.code, name: pl.name, city: pl.city },
    })
    plantsByCode.set(pl.code, plant.id)
  }
  console.log(`✅ Plants seeded (${plantsByCode.size} plants).`)

  // =========================================================================
  // 4. Seed First Admin Account (AWB-7 / AWB-2 seed requirement)
  // =========================================================================
  console.log('👤 Seeding default admin account...')
  const defaultPassword = generatePassword()
  const defaultPasswordHash = await hashPassword(defaultPassword)
  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } })
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Bambang Admin HO',
      username: 'admin',
      email: 'admin@kpncorp.com',
      phone: '+62 811 1234 567',
      passwordHash: defaultPasswordHash,
      accountType: 'INTERNAL',
      roleId: adminRoleId,
      isActive: true,
    },
  })
  if (!existingAdmin) deliverCredentials(adminUser.username, defaultPassword)
  console.log(`✅ Admin account seeded: ${adminUser.username} (${adminUser.email})`)

  // =========================================================================
  // 5. Seed Partners (from Excel references outside repo, or mock fallback)
  // =========================================================================
  console.log('🤝 Seeding SAP partner accounts...')

  // Possible paths for the reference Excel files (outside repo)
  const preregExcelPath = resolve(
    process.cwd(),
    '../../../references/data_mitra_customer_prereg.xlsx',
  )
  const vmsExcelPath = resolve(process.cwd(), '../../../references/data_vendor_vms.xlsx')
  const altPreregExcelPath = 'd:/KPN/references/data_mitra_customer_prereg.xlsx'
  const altVmsExcelPath = 'd:/KPN/references/data_vendor_vms.xlsx'

  const actualPreregPath = existsSync(preregExcelPath)
    ? preregExcelPath
    : existsSync(altPreregExcelPath)
      ? altPreregExcelPath
      : null

  const actualVmsPath = existsSync(vmsExcelPath)
    ? vmsExcelPath
    : existsSync(altVmsExcelPath)
      ? altVmsExcelPath
      : null

  interface PartnerItem {
    sapCode: string
    name: string
    partnerType: string
    city: string | null
    country: string | null
  }

  const partnersMap = new Map<string, PartnerItem>()

  if (actualPreregPath && actualVmsPath) {
    console.log(`📖 Loading partners from Excel files:`)
    console.log(`   - Customer & Pre-Registration: ${actualPreregPath}`)
    console.log(`   - Vendor VMS: ${actualVmsPath}`)

    const wbPrereg = XLSX.readFile(actualPreregPath)
    const wbVms = XLSX.readFile(actualVmsPath)

    // 1. Customers
    if (wbPrereg.Sheets['mst_customer']) {
      const customers = XLSX.utils.sheet_to_json<Record<string, string | number>>(
        wbPrereg.Sheets['mst_customer'],
      )
      for (const r of customers) {
        const code = (r.kunnr || '').toString().trim()
        if (!code || partnersMap.has(code)) continue
        partnersMap.set(code, {
          sapCode: code,
          name: (r.name_1 || code).toString().trim(),
          partnerType: 'CUSTOMER',
          city: r.ort_1 ? r.ort_1.toString().trim() : null,
          country: 'ID',
        })
      }
    }

    // 2. Vendors from prereg
    if (wbPrereg.Sheets['mst_vendor']) {
      const vendors = XLSX.utils.sheet_to_json<Record<string, string | number>>(
        wbPrereg.Sheets['mst_vendor'],
      )
      for (const r of vendors) {
        const code = (r.lifnr || '').toString().trim()
        if (!code || partnersMap.has(code)) continue
        partnersMap.set(code, {
          sapCode: code,
          name: (r.name_1 || code).toString().trim(),
          partnerType: 'VENDOR',
          city: null,
          country: 'ID',
        })
      }
    }

    // 3. Interco from prereg
    if (wbPrereg.Sheets['mst_interco']) {
      const interco = XLSX.utils.sheet_to_json<Record<string, string | number>>(
        wbPrereg.Sheets['mst_interco'],
      )
      for (const r of interco) {
        const code = (r.kunnr || '').toString().trim()
        if (!code || partnersMap.has(code)) continue
        partnersMap.set(code, {
          sapCode: code,
          name: (r.name_1 || code).toString().trim(),
          partnerType: 'INTERCO',
          city: r.ort_1 ? r.ort_1.toString().trim() : null,
          country: 'ID',
        })
      }
    }

    // 4. Enrich & add from VMS
    if (wbVms.Sheets['vendor']) {
      const vmsVendors = XLSX.utils.sheet_to_json<Record<string, string | number>>(
        wbVms.Sheets['vendor'],
      )
      for (const r of vmsVendors) {
        const code = (r.ven_code || '').toString().trim()
        if (!code) continue
        if (partnersMap.has(code)) {
          const item = partnersMap.get(code)!
          if (!item.city && r.city) item.city = r.city.toString().trim()
          if (r.country) item.country = r.country.toString().trim()
        } else {
          partnersMap.set(code, {
            sapCode: code,
            name: (r.name_1 || code).toString().trim(),
            partnerType: r.ven_group === 'INTERCO' ? 'INTERCO' : 'VENDOR',
            city: r.city ? r.city.toString().trim() : null,
            country: r.country ? r.country.toString().trim() : 'ID',
          })
        }
      }
    }
  } else {
    console.log(
      '⚠️  Excel reference files not found outside repo. Using benchmark partner dataset.',
    )
    const benchmarkPartners: PartnerItem[] = [
      {
        sapCode: 'KUNNR-10042',
        name: 'PT Indofood Sukses Makmur',
        partnerType: 'CUSTOMER',
        city: 'Jakarta',
        country: 'ID',
      },
      {
        sapCode: 'LIFNR-20085',
        name: 'CV Sawit Makmur Perkasa',
        partnerType: 'VENDOR',
        city: 'Dumai',
        country: 'ID',
      },
      {
        sapCode: 'CU00001000',
        name: 'ANEKA BOGA CARAKA',
        partnerType: 'CUSTOMER',
        city: 'JAKARTA PUSAT',
        country: 'ID',
      },
      {
        sapCode: 'CU00002000',
        name: 'CV. KHARISMA JAYA',
        partnerType: 'CUSTOMER',
        city: 'DELI SERDANG',
        country: 'ID',
      },
      {
        sapCode: 'AT11000001',
        name: 'PACIFIC INDOPALM INDUSTRIES PT.',
        partnerType: 'VENDOR',
        city: 'DUMAI',
        country: 'ID',
      },
      {
        sapCode: 'AT11000002',
        name: 'KHARISMA PEMASARAN BERSAMA PT.',
        partnerType: 'VENDOR',
        city: 'JAKARTA PUSAT',
        country: 'ID',
      },
      {
        sapCode: 'CI00001000',
        name: 'PT. BERKAT SAWIT UTAMA',
        partnerType: 'INTERCO',
        city: 'JAMBI',
        country: 'ID',
      },
      {
        sapCode: 'CI00002000',
        name: 'PT. AGRIPRIMA CIPTA PERSADA',
        partnerType: 'INTERCO',
        city: 'MERAUKE',
        country: 'ID',
      },
    ]
    for (const bp of benchmarkPartners) {
      partnersMap.set(bp.sapCode, bp)
    }
  }

  console.log(`💾 Inserting ${partnersMap.size} unique SAP partners into database in chunks...`)
  const partnerList = Array.from(partnersMap.values())
  const chunkSize = 1500
  for (let i = 0; i < partnerList.length; i += chunkSize) {
    const chunk = partnerList.slice(i, i + chunkSize)
    await prisma.partner.createMany({
      data: chunk.map((p) => ({
        sapCode: p.sapCode,
        name: p.name,
        partnerType: p.partnerType,
        city: p.city,
        country: p.country,
        isActive: true,
      })),
      skipDuplicates: true,
    })
    process.stdout.write(
      `   Inserted ${Math.min(i + chunkSize, partnerList.length)} / ${partnerList.length} partners...\r`,
    )
  }
  console.log(`\n✅ Finished inserting ${partnerList.length} partners.`)

  // =========================================================================
  // 6. Demonstrate Sample User-Partner Many-to-Many Linking
  // =========================================================================
  console.log('🔗 Seeding sample partner account linked to multiple SAP codes...')
  const sampleCustomer = await prisma.partner.findFirst({ where: { sapCode: 'CU00001000' } })
  const sampleCustomerBranch = await prisma.partner.findFirst({ where: { sapCode: 'CU00001001' } })
  const customerRoleId = rolesByCode.get('CUSTOMER')!

  if (sampleCustomer) {
    const partnerUser = await prisma.user.upsert({
      where: { username: 'CU00001000' },
      update: {
        name: sampleCustomer.name,
        accountType: 'PARTNER',
        roleId: customerRoleId,
        isActive: true,
      },
      create: {
        name: sampleCustomer.name,
        username: 'CU00001000',
        email: 'billing@anekaboga.co.id',
        phone: '+62 21 555 1234',
        passwordHash: defaultPasswordHash,
        accountType: 'PARTNER',
        roleId: customerRoleId,
        isActive: true,
      },
    })

    // Link primary SAP code
    await prisma.userPartner.upsert({
      where: {
        userId_partnerId: {
          userId: partnerUser.id,
          partnerId: sampleCustomer.id,
        },
      },
      update: { isPrimary: true },
      create: {
        userId: partnerUser.id,
        partnerId: sampleCustomer.id,
        isPrimary: true,
      },
    })

    // Link secondary SAP code (proving one account can link to multiple partner codes)
    if (sampleCustomerBranch) {
      await prisma.userPartner.upsert({
        where: {
          userId_partnerId: {
            userId: partnerUser.id,
            partnerId: sampleCustomerBranch.id,
          },
        },
        update: { isPrimary: false },
        create: {
          userId: partnerUser.id,
          partnerId: sampleCustomerBranch.id,
          isPrimary: false,
        },
      })
    }
    console.log(`✅ Sample partner account linked to SAP codes: CU00001000 and CU00001001.`)
  }

  console.log('\n✨ Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
