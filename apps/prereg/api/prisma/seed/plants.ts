import { prisma } from '../../src/config/prisma'

export async function seedPlants() {
  console.log('🏭 Seeding plants...')

  const plantsData = [
    {
      code: 'PRISCOLIN_KARAWANG',
      name: 'Priscolin Karawang',
      city: 'Karawang',
      sapPlantCode: 'PS23',
      companyGroup: 'DOWNSTREAM',
    },
    {
      code: 'PRISCOLIN_BEKASI',
      name: 'Priscolin Bekasi',
      city: 'Bekasi',
      sapPlantCode: 'PS21',
      companyGroup: 'DOWNSTREAM',
    },
    {
      code: 'DUMAI',
      name: 'Dumai Plant',
      city: 'Dumai',
      sapPlantCode: 'EU21',
      companyGroup: 'DOWNSTREAM',
    },
    {
      code: 'MEDAN',
      name: 'Medan Plant',
      city: 'Medan',
      sapPlantCode: null,
      companyGroup: null,
    },
    {
      code: 'JAKARTA_HO',
      name: 'Jakarta Head Office',
      city: 'Jakarta',
      sapPlantCode: null,
      companyGroup: null,
    },
  ]

  const plantsByCode = new Map<string, string>()

  for (const pl of plantsData) {
    const plant = await prisma.plant.upsert({
      where: { code: pl.code },
      update: {
        name: pl.name,
        city: pl.city,
        sapPlantCode: pl.sapPlantCode,
        companyGroup: pl.companyGroup,
        isActive: true,
      },
      create: {
        code: pl.code,
        name: pl.name,
        city: pl.city,
        sapPlantCode: pl.sapPlantCode,
        companyGroup: pl.companyGroup,
      },
    })

    plantsByCode.set(pl.code, plant.id)
  }

  for (const [incoterm, type] of [
    ['LCO', 'S'],
    ['FRC', 'T'],
  ] as const) {
    await prisma.julLoadingNoteType.upsert({
      where: { incoterm },
      update: { type },
      create: {
        incoterm,
        type,
      },
    })
  }

  await prisma.julTransportMode.upsert({
    where: { code: 'T' },
    update: {
      name: 'Truck',
      isActive: true,
    },
    create: {
      code: 'T',
      name: 'Truck',
      isActive: true,
    },
  })

  const materials8010 = [
    '8010-10.21520',
    '8010-10.21530',
    '8010-10.21540',
    '8010-10.21641',
    '8010-10.21646',
  ]

  const materials8050 = [
    '8050-10.21222',
    '8050-10.21122',
    '8050-10.21221',
    '8050-10.21022',
    '8050-10.21121',
    '8050-10.21101',
    '8050-10.23222',
    '8050-10.21124',
    '8050-10.23221',
    '8050-10.23223',
  ]

  for (const [plantCode, sapPlant] of [
    ['PRISCOLIN_KARAWANG', 'PS23'],
    ['PRISCOLIN_BEKASI', 'PS21'],
  ] as const) {
    const plantId = plantsByCode.get(plantCode)!

    for (const material of [...materials8010, ...materials8050]) {
      const factoryStorage = material.startsWith('8010-') ? 'TW51' : 'WT51'
      const otherStorage = sapPlant === 'PS21' && material === '8010-10.21530' ? 'TS05' : 'RS51'

      for (const incoterm of ['LCO', 'FRC'] as const) {
        await prisma.julPlantRule.upsert({
          where: {
            plantId_material_incoterm: {
              plantId,
              material,
              incoterm,
            },
          },
          update: {
            factoryStorage,
            otherStorage,
            factoryValuation: 'MAIN',
            otherValuation: 'TR-SALES',
          },
          create: {
            plantId,
            material,
            incoterm,
            factoryStorage,
            otherStorage,
            factoryValuation: 'MAIN',
            otherValuation: 'TR-SALES',
          },
        })
      }
    }
  }

  console.log(`✅ Plants and JUL downstream rules seeded (${plantsByCode.size} plants).`)

  return plantsByCode
}
