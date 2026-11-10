import { prisma } from '../../config/prisma'
import type { SapDriver, SapMasterImportResult, SapVehicle } from '../../types/sapMaster'

const CHUNK = 500
const STALE_AFTER_MS = 2 * 60 * 60 * 1000

function chunks<T>(rows: T[]) {
  return Array.from(
    {
      length: Math.ceil(rows.length / CHUNK),
    },
    (_, index) => rows.slice(index * CHUNK, (index + 1) * CHUNK),
  )
}

export default {
  searchDrivers(q: string) {
    return prisma.driver.findMany({
      where: {
        isActive: true,
        inSap: true,
        OR: [
          {
            licenseNumber: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        licenseNumber: true,
        name: true,
      },
      orderBy: [{ licenseNumber: 'asc' }],
      take: 20,
    })
  },

  findDriver(licenseNumber: string) {
    return prisma.driver.findFirst({
      where: {
        licenseNumber: {
          equals: licenseNumber,
          mode: 'insensitive',
        },
      },
      select: {
        licenseNumber: true,
        name: true,
        isActive: true,
        inSap: true,
      },
    })
  },

  async searchVehicles(q: string) {
    const rows = await prisma.vehicle.findMany({
      where: {
        isActive: true,
        inSap: true,
        plateNumber: {
          contains: q,
          mode: 'insensitive',
        },
      },
      select: { plateNumber: true },
      orderBy: [{ plateNumber: 'asc' }],
      take: 20,
    })

    return rows.map((row) => row.plateNumber)
  },

  findVehicle(plateNumber: string) {
    return prisma.vehicle.findFirst({
      where: {
        plateNumber: {
          equals: plateNumber,
          mode: 'insensitive',
        },
      },
      select: {
        plateNumber: true,
        isActive: true,
        inSap: true,
      },
    })
  },

  async saveDrivers(rows: SapDriver[]) {
    const now = new Date()

    for (const chunk of chunks(rows))
      await prisma.$transaction([
        prisma.driver.createMany({
          data: chunk.map((row) => ({
            licenseNumber: row.licenseNumber,
            name: row.name,
            sapLocation: row.location,
            inSap: true,
            sapSyncedAt: now,
          })),
          skipDuplicates: true,
        }),
        prisma.$executeRaw`
          UPDATE "mst_driver" AS d
          SET "name" = v.name, "sap_location" = v.location, "in_sap" = true,
            "sap_synced_at" = ${now}, "updated_at" = ${now}
          FROM unnest(
            ${chunk.map((row) => row.licenseNumber)}::text[],
            ${chunk.map((row) => row.name)}::text[],
            ${chunk.map((row) => row.location)}::text[]
          ) AS v(license, name, location)
          WHERE d."license_number" = v.license`,
      ])
  },

  async saveVehicles(rows: SapVehicle[]) {
    const now = new Date()

    for (const chunk of chunks(rows))
      await prisma.$transaction([
        prisma.vehicle.createMany({
          data: chunk.map((row) => ({
            plateNumber: row.plateNumber,
            sapLocation: row.location,
            inSap: true,
            sapSyncedAt: now,
          })),
          skipDuplicates: true,
        }),
        prisma.$executeRaw`
          UPDATE "mst_vehicle" AS d
          SET "sap_location" = v.location, "in_sap" = true,
            "sap_synced_at" = ${now}, "updated_at" = ${now}
          FROM unnest(
            ${chunk.map((row) => row.plateNumber)}::text[],
            ${chunk.map((row) => row.location)}::text[]
          ) AS v(plate, location)
          WHERE d."plate_number" = v.plate`,
      ])
  },

  async summary() {
    const [drivers, vehicles, latestImport] = await Promise.all([
      prisma.driver.count({
        where: {
          inSap: true,
          isActive: true,
        },
      }),
      prisma.vehicle.count({
        where: {
          inSap: true,
          isActive: true,
        },
      }),
      prisma.sapMasterImport.findFirst({
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      }),
    ])

    return {
      drivers,
      vehicles,
      latestImport,
    }
  },

  async startImport(startedById: string) {
    const now = new Date()

    await prisma.sapMasterImport.updateMany({
      where: {
        status: 'RUNNING',
        startedAt: {
          lt: new Date(now.getTime() - STALE_AFTER_MS),
        },
      },
      data: {
        status: 'FAILED',
        error: 'Interrupted before finishing',
        finishedAt: now,
      },
    })

    try {
      return await prisma.sapMasterImport.create({
        data: { startedById },
      })
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002')
        return null

      throw error
    }
  },

  progress(id: string, result: SapMasterImportResult) {
    return prisma.sapMasterImport.update({
      where: { id },
      data: result,
    })
  },

  finishImport(id: string, error?: string) {
    return prisma.sapMasterImport.update({
      where: { id },
      data: {
        status: error ? 'FAILED' : 'SUCCEEDED',
        error: error ?? null,
        finishedAt: new Date(),
      },
    })
  },
}
