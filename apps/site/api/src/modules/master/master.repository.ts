import type { MasterKind } from '@awb/contracts'
import { prisma } from '../../config/prisma'
import { Prisma } from '../../generated/prisma/client'
import type {
  CommodityInput,
  ContractInput,
  DestinationInput,
  DriverInput,
  EstateInput,
  MasterListFilter,
  QualityItemInput,
  RelationInput,
  TankerInput,
  TransactionTypeInput,
  TransporterInput,
  VehicleInput,
} from '../../types/master'

const SAP = 'SAP'
const CHUNK = 500

const sapActive = {
  source: SAP,
  isActive: true,
} as const

const chunks = <T>(rows: T[], size = CHUNK) =>
  Array.from(
    {
      length: Math.ceil(rows.length / size),
    },
    (_, i) => rows.slice(i * size, (i + 1) * size),
  )

const dec = (value: string | null | undefined) =>
  value === undefined
    ? undefined
    : value === null || value === ''
      ? null
      : new Prisma.Decimal(value)

/** Drops undefined values so an update only touches the fields the source sent. */
const sent = <T extends Record<string, unknown>>(data: T) =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>

const comparable = (value: unknown) =>
  value === null || value === undefined
    ? ''
    : value instanceof Date
      ? value.toISOString()
      : value instanceof Prisma.Decimal
        ? value.toString()
        : String(value)

/**
 * Inserts new keys, updates rows whose sent fields differ, and stamps pulled_at on the rest.
 * Shared by the SAP pull and the WB.NET backfill; every row written here is a SAP row.
 */
async function upsertMaster<T, D extends Record<string, unknown>>(
  rows: T[],
  keyOf: (row: T) => string,
  ops: {
    data: (row: T) => D
    existing: (keys: string[]) => Promise<Record<string, unknown>[]>
    keyField: string
    createMany: (data: D[]) => Promise<unknown>
    update: (key: string, data: Partial<D>) => Promise<unknown>
    touch: (keys: string[]) => Promise<unknown>
  },
) {
  const unique = new Map(rows.map((row) => [keyOf(row), row]))

  for (const batch of chunks([...unique.values()])) {
    const keys = batch.map(keyOf)

    const current = new Map(
      (await ops.existing(keys)).map((row) => [String(row[ops.keyField]), row]),
    )

    const fresh: D[] = []
    const unchanged: string[] = []

    for (const row of batch) {
      const data = ops.data(row)
      const stored = current.get(keyOf(row))

      if (!stored) {
        fresh.push(data)
        continue
      }

      const changes = sent(data)

      if (
        Object.entries(changes).some(
          ([field, value]) => comparable(value) !== comparable(stored[field]),
        )
      )
        await ops.update(keyOf(row), changes)
      else unchanged.push(keyOf(row))
    }

    for (const part of chunks(fresh, 100)) if (part.length) await ops.createMany(part)

    if (unchanged.length) await ops.touch(unchanged)
  }

  return unique.size
}

const stamp = (pulledAt: Date) => ({
  source: SAP,
  pulledAt,
  isActive: true,
})

export default {
  saveVehicles(rows: VehicleInput[], pulledAt: Date) {
    return upsertMaster(rows, (row) => row.plateNumber, {
      keyField: 'plateNumber',
      data: (row) => ({
        plateNumber: row.plateNumber,
        transporterCode: row.transporterCode,
        transporterName: row.transporterName,
        tankerNumber: row.tankerNumber,
        tareMinKg: dec(row.tareMinKg),
        tareMaxKg: dec(row.tareMaxKg),
        isBlacklisted: row.isBlacklisted,
      }),
      existing: (keys) =>
        prisma.vehicle.findMany({
          where: {
            plateNumber: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.vehicle.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (plateNumber, data) =>
        prisma.vehicle.update({
          where: {
            plateNumber_source: {
              plateNumber,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.vehicle.updateMany({
          where: {
            plateNumber: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })
  },

  saveDrivers(rows: DriverInput[], pulledAt: Date) {
    return upsertMaster(rows, (row) => row.licenseNumber, {
      keyField: 'licenseNumber',
      data: (row) => ({
        licenseNumber: row.licenseNumber,
        name: row.name,
        address: row.address,
        phone: row.phone,
        birthPlace: row.birthPlace,
        birthDate: row.birthDate,
        truckNumber: row.truckNumber,
        isBlacklisted: row.isBlacklisted,
      }),
      existing: (keys) =>
        prisma.driver.findMany({
          where: {
            licenseNumber: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.driver.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (licenseNumber, data) =>
        prisma.driver.update({
          where: {
            licenseNumber_source: {
              licenseNumber,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.driver.updateMany({
          where: {
            licenseNumber: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })
  },

  saveTransporters(rows: TransporterInput[], pulledAt: Date) {
    return upsertMaster(rows, (row) => row.code, {
      keyField: 'code',
      data: (row) => ({
        code: row.code,
        name: row.name,
        address: row.address,
        phone: row.phone,
        sapCode: row.sapCode,
        isBlacklisted: row.isBlacklisted,
      }),
      existing: (keys) =>
        prisma.transporter.findMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.transporter.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (code, data) =>
        prisma.transporter.update({
          where: {
            code_source: {
              code,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.transporter.updateMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })
  },

  saveTankers(rows: TankerInput[], pulledAt: Date) {
    return upsertMaster(rows, (row) => row.number, {
      keyField: 'number',
      data: (row) => ({
        number: row.number,
        truckNumber: row.truckNumber,
        capacityKg: dec(row.capacityKg),
        checkMode: row.checkMode,
        tolerancePercent: dec(row.tolerancePercent),
        toleranceKg: dec(row.toleranceKg),
      }),
      existing: (keys) =>
        prisma.tanker.findMany({
          where: {
            number: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.tanker.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (number, data) =>
        prisma.tanker.update({
          where: {
            number_source: {
              number,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.tanker.updateMany({
          where: {
            number: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })
  },

  saveDestinations(rows: DestinationInput[], pulledAt: Date) {
    return upsertMaster(rows, (row) => row.code, {
      keyField: 'code',
      data: (row) => ({
        code: row.code,
        name: row.name,
        storageLocation: row.storageLocation,
      }),
      existing: (keys) =>
        prisma.destination.findMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.destination.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (code, data) =>
        prisma.destination.update({
          where: {
            code_source: {
              code,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.destination.updateMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })
  },

  async saveContracts(rows: ContractInput[], pulledAt: Date) {
    const count = await upsertMaster(rows, (row) => row.doNumber, {
      keyField: 'doNumber',
      data: (row) => ({
        doNumber: row.doNumber,
        doDate: row.doDate,
        contractNumber: row.contractNumber,
        transactionCode: row.transactionCode,
        commodityCode: row.commodityCode,
        relationCode: row.relationCode,
        transporterCode: row.transporterCode,
        estateCode: row.estateCode,
        piNumber: row.piNumber,
        quantityKg: dec(row.quantityKg),
        tolerancePercent: dec(row.tolerancePercent),
        incoterm: row.incoterm,
        soNumber: row.soNumber,
        soItem: row.soItem,
        stoNumber: row.stoNumber,
        isClosed: row.isClosed,
        closedAt: row.closedAt,
      }),
      existing: (keys) =>
        prisma.contract.findMany({
          where: {
            doNumber: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.contract.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (doNumber, data) =>
        prisma.contract.update({
          where: {
            doNumber_source: {
              doNumber,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.contract.updateMany({
          where: {
            doNumber: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })

    // Quality specs are replaced as a whole for every contract that came with them.
    const withSpecs = rows.filter((row) => row.qualities !== undefined)

    for (const batch of chunks(withSpecs)) {
      const ids = new Map(
        (
          await prisma.contract.findMany({
            where: {
              doNumber: {
                in: batch.map((row) => row.doNumber),
              },
              source: SAP,
            },
            select: {
              id: true,
              doNumber: true,
            },
          })
        ).map((row) => [row.doNumber, row.id]),
      )

      await prisma.contractQuality.deleteMany({
        where: {
          contractId: {
            in: [...ids.values()],
          },
        },
      })

      const specs = batch.flatMap((row) => {
        const contractId = ids.get(row.doNumber)
        const seen = new Set<string>()

        return contractId
          ? (row.qualities ?? [])
              .filter((spec) => !seen.has(spec.sapCode) && seen.add(spec.sapCode))
              .map((spec) => ({
                contractId,
                sapCode: spec.sapCode,
                value: spec.value,
              }))
          : []
      })

      for (const part of chunks(specs, 300)) await prisma.contractQuality.createMany({ data: part })
    }

    return count
  },

  saveTransactionTypes(rows: TransactionTypeInput[], pulledAt: Date) {
    return upsertMaster(rows, (row) => row.code, {
      keyField: 'code',
      data: (row) => ({
        code: row.code,
        name: row.name,
        direction: row.direction,
        isReturn: row.isReturn,
        isVessel: row.isVessel,
        requiresLoadingNote: row.requiresLoadingNote,
        requiresTanker: row.requiresTanker,
      }),
      existing: (keys) =>
        prisma.transactionType.findMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.transactionType.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (code, data) =>
        prisma.transactionType.update({
          where: {
            code_source: {
              code,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.transactionType.updateMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })
  },

  saveCommodities(rows: CommodityInput[], pulledAt: Date) {
    return upsertMaster(rows, (row) => row.code, {
      keyField: 'code',
      data: (row) => ({
        code: row.code,
        name: row.name,
        unit: row.unit,
        tolerancePercent: dec(row.tolerancePercent),
        sapMaterialCode: row.sapMaterialCode,
      }),
      existing: (keys) =>
        prisma.commodity.findMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.commodity.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (code, data) =>
        prisma.commodity.update({
          where: {
            code_source: {
              code,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.commodity.updateMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })
  },

  saveRelations(rows: RelationInput[], pulledAt: Date) {
    return upsertMaster(rows, (row) => row.code, {
      keyField: 'code',
      data: (row) => ({
        code: row.code,
        name: row.name,
        type: row.type,
        city: row.city,
        isBlacklisted: row.isBlacklisted,
      }),
      existing: (keys) =>
        prisma.relation.findMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.relation.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (code, data) =>
        prisma.relation.update({
          where: {
            code_source: {
              code,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.relation.updateMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })
  },

  saveEstates(rows: EstateInput[], pulledAt: Date) {
    return upsertMaster(rows, (row) => row.code, {
      keyField: 'code',
      data: (row) => ({
        code: row.code,
        name: row.name,
        city: row.city,
        sapCode: row.sapCode,
      }),
      existing: (keys) =>
        prisma.estate.findMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.estate.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (code, data) =>
        prisma.estate.update({
          where: {
            code_source: {
              code,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.estate.updateMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })
  },

  saveQualityItems(rows: QualityItemInput[], pulledAt: Date) {
    return upsertMaster(rows, (row) => row.code, {
      keyField: 'code',
      data: (row) => ({
        code: row.code,
        name: row.name,
        sapCode: row.sapCode,
      }),
      existing: (keys) =>
        prisma.qualityItem.findMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
        }),
      createMany: (data) =>
        prisma.qualityItem.createMany({
          data: data.map((row) => ({
            ...row,
            ...stamp(pulledAt),
          })),
        }),
      update: (code, data) =>
        prisma.qualityItem.update({
          where: {
            code_source: {
              code,
              source: SAP,
            },
          },
          data: {
            ...data,
            ...stamp(pulledAt),
          },
        }),
      touch: (keys) =>
        prisma.qualityItem.updateMany({
          where: {
            code: { in: keys },
            source: SAP,
          },
          data: stamp(pulledAt),
        }),
    })
  },

  /** Active SAP rows per master kind. */
  countActive(kind: MasterKind) {
    const where = sapActive

    switch (kind) {
      case 'vehicle':
        return prisma.vehicle.count({ where })
      case 'driver':
        return prisma.driver.count({ where })
      case 'transporter':
        return prisma.transporter.count({ where })
      case 'tanker':
        return prisma.tanker.count({ where })
      case 'destination':
        return prisma.destination.count({ where })
      case 'contract':
        return prisma.contract.count({ where })
      case 'transactionType':
        return prisma.transactionType.count({ where })
      case 'commodity':
        return prisma.commodity.count({ where })
      case 'relation':
        return prisma.relation.count({ where })
      case 'estate':
        return prisma.estate.count({ where })
      case 'qualityItem':
        return prisma.qualityItem.count({ where })
    }
  },

  pulls() {
    return prisma.masterPull.findMany()
  },

  findPull(kind: MasterKind) {
    return prisma.masterPull.findUnique({
      where: { kind },
    })
  },

  recordPull(kind: MasterKind, result: { rowCount: number } | { error: string }) {
    const data =
      'error' in result
        ? {
            lastPulledAt: new Date(),
            lastPullStatus: 'FAILED',
            lastPullError: result.error.slice(0, 500),
            lastPullRowCount: null,
          }
        : {
            lastPulledAt: new Date(),
            lastPullStatus: 'SUCCESS',
            lastPullError: null,
            lastPullRowCount: result.rowCount,
          }

    return prisma.masterPull.upsert({
      where: { kind },
      create: {
        kind,
        ...data,
      },
      update: data,
    })
  },

  recordBackfill(kind: MasterKind, at: Date) {
    return prisma.masterPull.upsert({
      where: { kind },
      create: {
        kind,
        lastBackfilledAt: at,
      },
      update: { lastBackfilledAt: at },
    })
  },

  async list(kind: MasterKind, query: MasterListFilter) {
    const search = query.search?.trim()

    const like = (fields: string[]) =>
      search
        ? {
            OR: fields.map((field) => ({
              [field]: { contains: search },
            })),
          }
        : {}

    const page = {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }

    switch (kind) {
      case 'vehicle': {
        const where: Prisma.VehicleWhereInput = {
          ...sapActive,
          ...like(['plateNumber', 'transporterCode', 'transporterName', 'tankerNumber']),
        }

        return {
          kind,
          rows: await prisma.vehicle.findMany({
            where,
            orderBy: [{ plateNumber: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.vehicle.count({ where }),
        } as const
      }

      case 'driver': {
        const where: Prisma.DriverWhereInput = {
          ...sapActive,
          ...like(['licenseNumber', 'name']),
        }

        return {
          kind,
          rows: await prisma.driver.findMany({
            where,
            orderBy: [{ licenseNumber: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.driver.count({ where }),
        } as const
      }

      case 'transporter': {
        const where: Prisma.TransporterWhereInput = {
          ...sapActive,
          ...like(['code', 'name']),
        }

        return {
          kind,
          rows: await prisma.transporter.findMany({
            where,
            orderBy: [{ code: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.transporter.count({ where }),
        } as const
      }

      case 'tanker': {
        const where: Prisma.TankerWhereInput = {
          ...sapActive,
          ...like(['number', 'truckNumber']),
        }

        return {
          kind,
          rows: await prisma.tanker.findMany({
            where,
            orderBy: [{ number: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.tanker.count({ where }),
        } as const
      }

      case 'destination': {
        const where: Prisma.DestinationWhereInput = {
          ...sapActive,
          ...like(['code', 'name']),
        }

        return {
          kind,
          rows: await prisma.destination.findMany({
            where,
            orderBy: [{ code: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.destination.count({ where }),
        } as const
      }

      case 'contract': {
        const where: Prisma.ContractWhereInput = {
          ...sapActive,
          ...like(['doNumber', 'contractNumber', 'piNumber', 'relationCode', 'commodityCode']),
        }

        // Open DOs first, newest first, so a lookup shows the ones that can still be registered.
        return {
          kind,
          rows: await prisma.contract.findMany({
            where,
            include: {
              qualities: {
                orderBy: { sapCode: 'asc' },
              },
            },
            orderBy: [{ isClosed: 'asc' }, { doDate: 'desc' }, { doNumber: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.contract.count({ where }),
        } as const
      }

      case 'transactionType': {
        const where: Prisma.TransactionTypeWhereInput = {
          ...sapActive,
          ...like(['code', 'name']),
        }

        return {
          kind,
          rows: await prisma.transactionType.findMany({
            where,
            orderBy: [{ code: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.transactionType.count({ where }),
        } as const
      }

      case 'commodity': {
        const where: Prisma.CommodityWhereInput = {
          ...sapActive,
          ...like(['code', 'name']),
        }

        return {
          kind,
          rows: await prisma.commodity.findMany({
            where,
            orderBy: [{ code: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.commodity.count({ where }),
        } as const
      }

      case 'relation': {
        const where: Prisma.RelationWhereInput = {
          ...sapActive,
          ...like(['code', 'name']),
        }

        return {
          kind,
          rows: await prisma.relation.findMany({
            where,
            orderBy: [{ code: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.relation.count({ where }),
        } as const
      }

      case 'estate': {
        const where: Prisma.EstateWhereInput = {
          ...sapActive,
          ...like(['code', 'name']),
        }

        return {
          kind,
          rows: await prisma.estate.findMany({
            where,
            orderBy: [{ code: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.estate.count({ where }),
        } as const
      }

      case 'qualityItem': {
        const where: Prisma.QualityItemWhereInput = {
          ...sapActive,
          ...like(['code', 'name', 'sapCode']),
        }

        return {
          kind,
          rows: await prisma.qualityItem.findMany({
            where,
            orderBy: [{ code: 'asc' }, { id: 'asc' }],
            ...page,
          }),
          total: await prisma.qualityItem.count({ where }),
        } as const
      }
    }
  },

  /** Names for the codes a contract refers to, from the SAP masters (inactive rows included). */
  async contractNames(codes: {
    commodity: string[]
    relation: string[]
    transactionType: string[]
    estate: string[]
  }) {
    const [commodities, relations, types, estates] = await Promise.all([
      prisma.commodity.findMany({
        where: {
          source: SAP,
          code: { in: codes.commodity },
        },
        select: {
          code: true,
          name: true,
        },
      }),
      prisma.relation.findMany({
        where: {
          source: SAP,
          code: { in: codes.relation },
        },
        select: {
          code: true,
          name: true,
        },
      }),
      prisma.transactionType.findMany({
        where: {
          source: SAP,
          code: { in: codes.transactionType },
        },
        select: {
          code: true,
          name: true,
        },
      }),
      prisma.estate.findMany({
        where: {
          source: SAP,
          code: { in: codes.estate },
        },
        select: {
          code: true,
          name: true,
        },
      }),
    ])

    const byCode = (rows: { code: string; name: string }[]) =>
      new Map(rows.map((row) => [row.code, row.name]))

    return {
      commodity: byCode(commodities),
      relation: byCode(relations),
      transactionType: byCode(types),
      estate: byCode(estates),
    }
  },

  /** Active SAP master rows a registration refers to. */
  async forRegistration(refs: {
    plateNumber: string
    licenseNumber: string | null
    transporterCode: string | null
    tankerNumber: string | null
    destinations: string[]
    doNumbers: string[]
  }) {
    const [vehicle, driver, transporter, tanker, destinations, contracts] = await Promise.all([
      prisma.vehicle.findFirst({
        where: {
          ...sapActive,
          plateNumber: refs.plateNumber,
        },
      }),
      refs.licenseNumber
        ? prisma.driver.findFirst({
            where: {
              ...sapActive,
              licenseNumber: refs.licenseNumber,
            },
          })
        : null,
      refs.transporterCode
        ? prisma.transporter.findFirst({
            where: {
              ...sapActive,
              code: refs.transporterCode,
            },
          })
        : null,
      refs.tankerNumber
        ? prisma.tanker.findFirst({
            where: {
              ...sapActive,
              number: refs.tankerNumber,
            },
          })
        : null,
      prisma.destination.findMany({
        where: {
          ...sapActive,
          code: { in: refs.destinations },
        },
      }),
      prisma.contract.findMany({
        where: {
          ...sapActive,
          doNumber: { in: refs.doNumbers },
        },
      }),
    ])

    return {
      vehicle,
      driver,
      transporter,
      tanker,
      destinations,
      contracts,
    }
  },
}
