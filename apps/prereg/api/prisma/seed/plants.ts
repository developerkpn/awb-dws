import { prisma } from '../../src/config/prisma'

export async function seedPlants() {
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
  return plantsByCode
}
