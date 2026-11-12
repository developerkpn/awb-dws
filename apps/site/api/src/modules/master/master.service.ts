import { CustomError } from '@awb/server-core'
import {
  masterKinds,
  type ContractMaster,
  type MasterKind,
  type MasterListResult,
  type MasterPullStatus,
  type MasterRowByKind,
} from '@awb/contracts'
import { env } from '../../config/env'
import type { Prisma } from '../../generated/prisma/client'
import { sapCollectAll } from '../../lib/sap'
import type { ListedMasters, MasterInputByKind, MasterListFilter, SapRow } from '../../types/master'
import { plate, sapLocation, sapRelation, sapVehicle } from './master.mappers'
import repository from './master.repository'

const iso = (value: Date | null) => value?.toISOString() ?? null
const decimal = (value: Prisma.Decimal | null) => value?.toString() ?? null

/** Rows SAP sends for this plant; SAP ignores the filter on some sets, so check it again here. */
const forThisPlant = (rows: SapRow[]) =>
  env.SITE_WB_LOCATION
    ? rows.filter((row) => sapLocation(row) === env.SITE_WB_LOCATION?.toUpperCase())
    : rows

/**
 * Masters with a SAP service. SIMSet only answers exact lookups (a list returns nothing), so
 * drivers have no pull yet; the others wait for SAP to add a service.
 */
const PULLERS: Partial<Record<MasterKind, (pulledAt: Date) => Promise<number>>> = {
  async vehicle(pulledAt) {
    const filter = env.SITE_WB_LOCATION
      ? `ZwbLoc eq '${env.SITE_WB_LOCATION.replace(/'/g, "''")}'`
      : undefined

    const rows = forThisPlant(
      await sapCollectAll('TRUCKSet', (row) => plate(row.Nnopolisi) ?? '', { filter }),
    )

    return repository.saveVehicles(
      rows.flatMap((row) => sapVehicle(row) ?? []),
      pulledAt,
    )
  },
  async relation(pulledAt) {
    const customers = await sapCollectAll('KUNNRSet', (row) => String(row.Kunnr ?? ''))
    const vendors = await sapCollectAll('LIFNRSet', (row) => String(row.Lifnr ?? ''))

    return repository.saveRelations(
      [
        ...customers.flatMap((row) => sapRelation(row, 'B') ?? []),
        ...vendors.flatMap((row) => sapRelation(row, 'S') ?? []),
      ],
      pulledAt,
    )
  },
}

const running = new Set<MasterKind>()

function present(
  listed: ListedMasters,
  names: Awaited<ReturnType<typeof repository.contractNames>> | null,
) {
  switch (listed.kind) {
    case 'vehicle':
      return listed.rows.map((row): MasterRowByKind['vehicle'] => ({
        plateNumber: row.plateNumber,
        transporterCode: row.transporterCode,
        transporterName: row.transporterName,
        tankerNumber: row.tankerNumber,
        tareMinKg: decimal(row.tareMinKg),
        tareMaxKg: decimal(row.tareMaxKg),
        isBlacklisted: row.isBlacklisted,
        pulledAt: iso(row.pulledAt),
      }))
    case 'driver':
      return listed.rows.map((row): MasterRowByKind['driver'] => ({
        licenseNumber: row.licenseNumber,
        name: row.name,
        address: row.address,
        phone: row.phone,
        truckNumber: row.truckNumber,
        isBlacklisted: row.isBlacklisted,
        pulledAt: iso(row.pulledAt),
      }))
    case 'transporter':
      return listed.rows.map((row): MasterRowByKind['transporter'] => ({
        code: row.code,
        name: row.name,
        address: row.address,
        phone: row.phone,
        isBlacklisted: row.isBlacklisted,
        pulledAt: iso(row.pulledAt),
      }))
    case 'tanker':
      return listed.rows.map((row): MasterRowByKind['tanker'] => ({
        number: row.number,
        truckNumber: row.truckNumber,
        capacityKg: decimal(row.capacityKg),
        pulledAt: iso(row.pulledAt),
      }))
    case 'destination':
      return listed.rows.map((row): MasterRowByKind['destination'] => ({
        code: row.code,
        name: row.name,
        storageLocation: row.storageLocation,
        pulledAt: iso(row.pulledAt),
      }))
    case 'contract':
      return listed.rows.map((row): ContractMaster => ({
        doNumber: row.doNumber,
        doDate: iso(row.doDate),
        contractNumber: row.contractNumber,
        transactionCode: row.transactionCode,
        transactionName: names?.transactionType.get(row.transactionCode) ?? null,
        commodityCode: row.commodityCode,
        commodityName: (row.commodityCode && names?.commodity.get(row.commodityCode)) || null,
        relationCode: row.relationCode,
        relationName: (row.relationCode && names?.relation.get(row.relationCode)) || null,
        transporterCode: row.transporterCode,
        estateCode: row.estateCode,
        estateName: (row.estateCode && names?.estate.get(row.estateCode)) || null,
        piNumber: row.piNumber,
        quantityKg: decimal(row.quantityKg),
        tolerancePercent: decimal(row.tolerancePercent),
        soNumber: row.soNumber,
        soItem: row.soItem,
        stoNumber: row.stoNumber,
        isClosed: row.isClosed,
        qualities: row.qualities.map((spec) => ({
          sapCode: spec.sapCode,
          value: spec.value,
        })),
        pulledAt: iso(row.pulledAt),
      }))
    case 'transactionType':
      return listed.rows.map((row): MasterRowByKind['transactionType'] => ({
        code: row.code,
        name: row.name,
        direction: row.direction === 'I' || row.direction === 'O' ? row.direction : null,
        isReturn: row.isReturn,
        isVessel: row.isVessel,
        requiresLoadingNote: row.requiresLoadingNote,
        requiresTanker: row.requiresTanker,
        pulledAt: iso(row.pulledAt),
      }))
    case 'commodity':
      return listed.rows.map((row): MasterRowByKind['commodity'] => ({
        code: row.code,
        name: row.name,
        unit: row.unit,
        tolerancePercent: decimal(row.tolerancePercent),
        sapMaterialCode: row.sapMaterialCode,
        pulledAt: iso(row.pulledAt),
      }))
    case 'relation':
      return listed.rows.map((row): MasterRowByKind['relation'] => ({
        code: row.code,
        name: row.name,
        type: row.type === 'B' || row.type === 'S' ? row.type : null,
        city: row.city,
        isBlacklisted: row.isBlacklisted,
        pulledAt: iso(row.pulledAt),
      }))
    case 'estate':
      return listed.rows.map((row): MasterRowByKind['estate'] => ({
        code: row.code,
        name: row.name,
        city: row.city,
        sapCode: row.sapCode,
        pulledAt: iso(row.pulledAt),
      }))
    case 'qualityItem':
      return listed.rows.map((row): MasterRowByKind['qualityItem'] => ({
        code: row.code,
        name: row.name,
        sapCode: row.sapCode,
        pulledAt: iso(row.pulledAt),
      }))
  }
}

const unique = (values: (string | null)[]) => [
  ...new Set(values.filter((value): value is string => !!value)),
]

export default {
  async status(kind: MasterKind): Promise<MasterPullStatus> {
    const [rowCount, pull] = await Promise.all([
      repository.countActive(kind),
      repository.findPull(kind),
    ])

    return {
      kind,
      sapAvailable: kind in PULLERS,
      rowCount,
      lastPulledAt: iso(pull?.lastPulledAt ?? null),
      lastPullStatus:
        pull?.lastPullStatus === 'SUCCESS' || pull?.lastPullStatus === 'FAILED'
          ? pull.lastPullStatus
          : null,
      lastPullError: pull?.lastPullError ?? null,
      lastPullRowCount: pull?.lastPullRowCount ?? null,
      lastBackfilledAt: iso(pull?.lastBackfilledAt ?? null),
    }
  },

  statuses() {
    return Promise.all(masterKinds.map((kind) => this.status(kind)))
  },

  async list<K extends MasterKind>(kind: K, query: MasterListFilter): Promise<MasterListResult<K>> {
    const listed = await repository.list(kind, query)

    const names =
      listed.kind === 'contract'
        ? await repository.contractNames({
            commodity: unique(listed.rows.map((row) => row.commodityCode)),
            relation: unique(listed.rows.map((row) => row.relationCode)),
            transactionType: unique(listed.rows.map((row) => row.transactionCode)),
            estate: unique(listed.rows.map((row) => row.estateCode)),
          })
        : null

    return {
      items: present(listed, names) as MasterRowByKind[K][],
      total: listed.total,
      status: await this.status(kind),
    }
  },

  async pull(kind: MasterKind) {
    const puller = PULLERS[kind]

    if (!puller) throw new CustomError(`SAP service for ${kind} is not available yet`, 409)

    if (running.has(kind)) throw new CustomError(`A pull for ${kind} is already running`, 409)

    running.add(kind)

    try {
      const rowCount = await puller(new Date())

      await repository.recordPull(kind, { rowCount })
    } catch (error) {
      await repository.recordPull(kind, {
        error: error instanceof Error ? error.message : 'SAP pull failed',
      })

      throw error
    } finally {
      running.delete(kind)
    }

    return this.status(kind)
  },

  /** Pulls every master that has a SAP service, one after another; failures are recorded per kind. */
  async pullAll() {
    for (const kind of masterKinds) {
      if (!(kind in PULLERS)) continue

      await this.pull(kind).catch((error: unknown) =>
        console.error(
          `[master-pull] ${kind}: ${error instanceof Error ? error.message : 'failed'}`,
        ),
      )
    }
  },

  /** Active SAP rows a registration refers to, plus the names of the codes on its DOs. */
  async forRegistration(refs: Parameters<typeof repository.forRegistration>[0]) {
    const found = await repository.forRegistration(refs)

    const names = await repository.contractNames({
      commodity: unique(found.contracts.map((row) => row.commodityCode)),
      relation: unique(found.contracts.map((row) => row.relationCode)),
      transactionType: unique(found.contracts.map((row) => row.transactionCode)),
      estate: unique(found.contracts.map((row) => row.estateCode)),
    })

    return {
      ...found,
      names,
    }
  },

  /** Writes WB.NET backfill rows as SAP rows and stamps the backfill time for the kind. */
  async backfill<K extends MasterKind>(kind: K, rows: MasterInputByKind[K][], at = new Date()) {
    const save: {
      [P in MasterKind]: (input: MasterInputByKind[P][], pulledAt: Date) => Promise<number>
    } = {
      vehicle: repository.saveVehicles,
      driver: repository.saveDrivers,
      transporter: repository.saveTransporters,
      tanker: repository.saveTankers,
      destination: repository.saveDestinations,
      contract: repository.saveContracts,
      transactionType: repository.saveTransactionTypes,
      commodity: repository.saveCommodities,
      relation: repository.saveRelations,
      estate: repository.saveEstates,
      qualityItem: repository.saveQualityItems,
    }

    const count = await save[kind](rows, at)

    await repository.recordBackfill(kind, at)

    return count
  },
}
