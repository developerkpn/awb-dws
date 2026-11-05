import { prisma } from '../src/config/prisma'

export async function seedCitiesAndTransporters(): Promise<void> {
  console.log('[Seed] Seeding sample cities and transporters...')

  // 1. Seed Cities
  const cities = [
    { name: 'Karawang', province: 'Jawa Barat' },
    { name: 'Jakarta', province: 'DKI Jakarta' },
    { name: 'Bekasi', province: 'Jawa Barat' },
    { name: 'Dumai', province: 'Riau' },
    { name: 'Medan', province: 'Sumatera Utara' },
    { name: 'Surabaya', province: 'Jawa Timur' },
    { name: 'Bandar Lampung', province: 'Lampung' },
    { name: 'Pontianak', province: 'Kalimantan Barat' },
  ]

  const seededCities = new Map<string, string>()
  for (const city of cities) {
    const record = await prisma.city.upsert({
      where: { name: city.name },
      update: { province: city.province },
      create: city,
    })
    seededCities.set(record.name, record.id)
  }

  // 2. Seed Transporters (acuan struktur wb_transporter WB.NET)
  const transporters = [
    {
      code: 'TR-PNR',
      name: 'PT Puninar Jaya',
      address: 'Jl. Raya Cakung Cilincing No. 12',
      phone: '021-4601234',
      contactPerson: 'Agus Pratama',
      cityName: 'Jakarta',
    },
    {
      code: 'TR-DNX',
      name: 'PT Dunex Logistik Indonesia',
      address: 'Jl. Agung Karya VII No. 1, Sunter',
      phone: '021-4682345',
      contactPerson: 'Bambang Santoso',
      cityName: 'Jakarta',
    },
    {
      code: 'TR-SDR',
      name: 'PT Samudera Indonesia Logistik',
      address: 'Gedung Samudera Indonesia, Jl. Letjen S. Parman',
      phone: '021-5203456',
      contactPerson: 'Dedi Irawan',
      cityName: 'Jakarta',
    },
    {
      code: 'TR-KTC',
      name: 'PT Kencana Trans Cargo',
      address: 'Kawasan Industri KIIC Lot C-4',
      phone: '0267-840123',
      contactPerson: 'Hendra Wijaya',
      cityName: 'Karawang',
    },
    {
      code: 'TR-SRJ',
      name: 'CV Sumber Rejeki Trans',
      address: 'Jl. Raya Bukit Timah KM 7',
      phone: '0765-38012',
      contactPerson: 'Siti Rahayu',
      cityName: 'Dumai',
    },
    {
      code: 'TR-MTR',
      name: 'PT Mitra Trans Mandiri',
      address: 'Jl. Yos Sudarso KM 9.5',
      phone: '061-661234',
      contactPerson: 'Eko Prasetyo',
      cityName: 'Medan',
    },
  ]

  for (const t of transporters) {
    const cityId = seededCities.get(t.cityName)
    await prisma.transporter.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        address: t.address,
        phone: t.phone,
        contactPerson: t.contactPerson,
        cityId,
        isActive: true,
      },
      create: {
        code: t.code,
        name: t.name,
        address: t.address,
        phone: t.phone,
        contactPerson: t.contactPerson,
        cityId,
        isActive: true,
      },
    })
  }

  console.log(
    `[Seed] Successfully seeded ${cities.length} cities and ${transporters.length} transporters.`,
  )
}
