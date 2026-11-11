import { randomUUID } from 'node:crypto'
import type {
  BelPoItem,
  BelPoItemChoice,
  BelRequestDetail,
  BelRequestLine,
  BelRequestSummary,
} from '@awb/contracts'
import { CustomError } from '@awb/server-core'
import { prisma } from '../../config/prisma'
import { Prisma } from '../../generated/prisma/client'
import { businessDate, quantity, quantityText } from '../../lib/quantity'
import { belPoSnapshot } from '../sap/sap.schema'
import type { BelStagePayload } from '../../types/sap'
import type { BelListQuery, BelScope, PreparedBelLine, StoredBelRequest, Tx } from '../../types/bel'

const REQUEST_INCLUDE = {
  vendor: {
    select: {
      id: true,
      name: true,
      username: true,
    },
  },
  lines: {
    include: {
      document: {
        include: {
          plant: true,
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  history: {
    include: {
      actor: {
        select: {
          name: true,
          username: true,
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
} as const satisfies Prisma.BelRegistrationInclude

const parseSnapshot = (value: unknown): BelPoItem => belPoSnapshot.parse(value)

const dbDecimal = (value: { toString(): string } | string | number) =>
  quantityText(quantity(String(value)))

function scopeWhere(scope: BelScope): Prisma.BelRegistrationWhereInput {
  return {
    ...(scope.vendorId ? { vendorId: scope.vendorId } : {}),
    ...(scope.plantIds
      ? {
          lines: {
            some: {
              document: {
                plantId: {
                  in: scope.plantIds,
                },
              },
            },
          },
        }
      : {}),
  }
}

function searchWhere(query: BelListQuery): Prisma.BelRegistrationWhereInput {
  const filters: Prisma.BelRegistrationWhereInput[] = []

  if (query.status) {
    filters.push({
      status: query.status,
    })
  }

  if (query.vendorId) {
    filters.push({
      vendorId: query.vendorId,
    })
  }

  if (query.search) {
    const term = query.search

    filters.push({
      OR: [
        {
          number: {
            contains: term,
            mode: 'insensitive',
          },
        },
        {
          vendor: {
            OR: [
              {
                name: {
                  contains: term,
                  mode: 'insensitive',
                },
              },
              {
                username: {
                  contains: term,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
        {
          lines: {
            some: {
              OR: [
                {
                  driverLicenseNumber: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
                {
                  vehiclePlateNumber: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
                {
                  document: {
                    poNumber: {
                      contains: term,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    })
  }

  return filters.length ? { AND: filters } : {}
}

function orderByFor(query: BelListQuery): Prisma.BelRegistrationOrderByWithRelationInput[] {
  const direction = query.sortOrder

  if (query.sortBy === 'number') {
    return [
      {
        number: direction,
      },
      {
        id: direction,
      },
    ]
  }

  if (query.sortBy === 'vendor') {
    return [
      {
        vendor: {
          name: direction,
        },
      },
      {
        id: direction,
      },
    ]
  }

  if (query.sortBy === 'status') {
    return [
      {
        status: direction,
      },
      {
        id: direction,
      },
    ]
  }

  return [
    {
      createdAt: direction,
    },
    {
      id: direction,
    },
  ]
}

async function reservedByPoItem(
  tx: Tx,
  vendorId: string,
  keys: Array<{ poNumber: string; poItem: string }>,
  excludeRegistrationId?: string,
) {
  const result = new Map<string, bigint>()

  if (!keys.length) return result

  const lines = await tx.belLine.findMany({
    where: {
      status: {
        in: ['DRAFT', 'SUBMITTED', 'APPROVED'],
      },
      ...(excludeRegistrationId
        ? {
            registrationId: {
              not: excludeRegistrationId,
            },
          }
        : {}),
      document: {
        vendorId,
        OR: keys.map((entry) => ({
          poNumber: entry.poNumber,
          poItem: entry.poItem,
        })),
      },
    },
    select: {
      quantity: true,
      document: {
        select: {
          poNumber: true,
          poItem: true,
        },
      },
    },
  })

  for (const line of lines) {
    const mapKey = line.document.poNumber + ':' + line.document.poItem
    const current = result.get(mapKey) ?? 0n

    result.set(mapKey, current + quantity(String(line.quantity)))
  }

  return result
}

async function assertPoCapacity(
  tx: Tx,
  vendorId: string,
  prepared: PreparedBelLine[],
  excludeRegistrationId?: string,
) {
  const totals = new Map<string, { snapshot: BelPoItem; requested: bigint }>()

  for (const line of prepared) {
    const key = line.documentSnapshot.poNumber + ':' + line.documentSnapshot.poItem
    const existing = totals.get(key)
    const added = quantity(line.quantity)

    totals.set(key, {
      snapshot: line.documentSnapshot,
      requested: (existing?.requested ?? 0n) + added,
    })
  }

  const sortedKeys = [...totals.keys()].sort()

  for (const key of sortedKeys) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'bel:' + vendorId + ':' + key}))`
  }

  const keys = sortedKeys.map((key) => {
    const snapshot = totals.get(key)!.snapshot

    return {
      poNumber: snapshot.poNumber,
      poItem: snapshot.poItem,
    }
  })

  const reservedMap = await reservedByPoItem(tx, vendorId, keys, excludeRegistrationId)

  for (const key of sortedKeys) {
    const entry = totals.get(key)!
    const ordered = quantity(entry.snapshot.orderedQuantity)
    const sapReceived = quantity(entry.snapshot.sapReceivedQuantity)
    const sapRemaining = ordered > sapReceived ? ordered - sapReceived : 0n
    const reserved = reservedMap.get(key) ?? 0n
    const available = sapRemaining > reserved ? sapRemaining - reserved : 0n

    if (entry.requested > available) {
      throw new CustomError(
        `PO ${entry.snapshot.poNumber}/${entry.snapshot.poItem} remaining quota is ${quantityText(available)} ${entry.snapshot.uom}`,
        409,
      )
    }
  }
}

async function findScoped(db: Tx | typeof prisma, id: string, scope: BelScope) {
  return db.belRegistration.findFirst({
    where: {
      AND: [
        {
          id,
        },
        scopeWhere(scope),
      ],
    },
    include: REQUEST_INCLUDE,
  })
}

// Approve, reject and cancel write to Oracle inside the transaction; Prisma's 5 s default is too short.
const ORACLE_TRANSACTION = {
  maxWait: 10_000,
  timeout: 60_000,
}

async function lockRegistration(tx: Tx, id: string) {
  await tx.$executeRaw`SELECT id FROM awb_bel_registration WHERE id = ${id}::uuid FOR UPDATE`
}

function assertVersion(current: number, expected?: number) {
  if (expected !== undefined && current !== expected) {
    throw new CustomError('BEL request was updated elsewhere; refresh and retry', 409)
  }
}

export function buildBelStagePayloads(
  row: StoredBelRequest,
  actorUsername: string,
  now: Date,
  action: 'APPROVED' | 'CANCELLED',
): BelStagePayload[] {
  const timestamp = now.toISOString()

  // A retraction also covers submitted lines: an approval can reach Oracle and still roll back here.
  return row.lines
    .filter((line) =>
      action === 'APPROVED'
        ? line.status === 'SUBMITTED'
        : ['SUBMITTED', 'APPROVED'].includes(line.status),
    )
    .map((line) => {
      const snapshot = parseSnapshot(line.documentSnapshot)

      return {
        DET_ID: line.id,
        HEAD_ID: row.id,
        REG_NUMBER: row.number,
        LIFNR: row.vendor.username,
        EBELN: snapshot.poNumber,
        EBELP: snapshot.poItem,
        MATNR: snapshot.material,
        WERKS: snapshot.sapPlant,
        PLN_MENGE: dbDecimal(line.quantity),
        MEINS: snapshot.uom,
        CREDAT: line.loadingDate ? line.loadingDate.toISOString().slice(0, 10) : null,
        ZZTRANSP_TYPE: line.mediaTransport,
        WNOSIM: line.driverLicenseNumber ?? '',
        WNONAMA: line.driverName,
        WNOPOLISI: line.vehiclePlateNumber ?? '',
        REMARK: line.remark,
        CREATE_BY: actorUsername,
        CREATE_AT: timestamp,
        USERSAP: actorUsername,
        PREREG_STATUS: action,
        FLAG: action === 'APPROVED' ? 'I' : 'U',
        ISACTIVE: action === 'APPROVED' ? 'TRUE' : 'FALSE',
        PREREG_FLAG: 'I',
        ISRETREIVEDBYSAP: 'FALSE',
      }
    })
}

export function mapBelSummary(row: StoredBelRequest): BelRequestSummary {
  const docs = [
    ...new Set(row.lines.map((line) => line.document.poNumber + '/' + line.document.poItem)),
  ]

  return {
    id: row.id,
    number: row.number,
    status: row.status as BelRequestSummary['status'],
    version: row.version,
    vendor: {
      id: row.vendor.id,
      name: row.vendor.name,
      username: row.vendor.username,
    },
    documents: docs,
    lineCount: row.lines.length,
    approvedCount: row.lines.filter((line) => line.status === 'APPROVED').length,
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapBelDetail(row: StoredBelRequest): BelRequestDetail {
  const summary = mapBelSummary(row)

  const lines: BelRequestLine[] = row.lines.map((line) => {
    const snapshot = parseSnapshot(line.documentSnapshot)

    return {
      id: line.id,
      documentId: line.documentId,
      poNumber: snapshot.poNumber,
      poItem: snapshot.poItem,
      material: snapshot.material,
      description: snapshot.description,
      plantName: line.document.plant.name,
      sapPlant: snapshot.sapPlant,
      uom: snapshot.uom,
      orderedQuantity: snapshot.orderedQuantity,
      sapReceivedQuantity: snapshot.sapReceivedQuantity,
      driverLicenseNumber: line.driverLicenseNumber,
      driverName: line.driverName,
      vehiclePlateNumber: line.vehiclePlateNumber,
      quantity: dbDecimal(line.quantity),
      loadingDate: line.loadingDate ? line.loadingDate.toISOString().slice(0, 10) : null,
      mediaTransport: line.mediaTransport,
      remark: line.remark,
      status: line.status as BelRequestLine['status'],
      stagedAt: line.stagedAt ? line.stagedAt.toISOString() : null,
      stageError: line.stageError,
    }
  })

  return {
    ...summary,
    lines,
    history: row.history.map((entry) => ({
      id: entry.id,
      action: entry.action,
      reason: entry.reason,
      actor: entry.actor ? entry.actor.name : null,
      createdAt: entry.createdAt.toISOString(),
    })),
  }
}

export default {
  parseSnapshot,

  async find(id: string, scope: BelScope) {
    return findScoped(prisma, id, scope)
  },

  async findVendor(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        role: true,
        plants: {
          select: {
            plantId: true,
          },
        },
      },
    })
  },

  async listVendors() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          code: 'VENDOR',
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
      },
      orderBy: [{ name: 'asc' }, { username: 'asc' }],
    })
  },

  async plantsByCodes(codes: string[]) {
    return prisma.plant.findMany({
      where: {
        sapPlantCode: {
          in: codes,
        },
        isActive: true,
      },
    })
  },

  async userPlantIds(userId: string) {
    const rows = await prisma.userPlant.findMany({
      where: {
        userId,
      },
      select: {
        plantId: true,
      },
    })

    return rows.map((row) => row.plantId)
  },

  async documentForVendor(vendorId: string, documentId: string) {
    return prisma.belDocument.findFirst({
      where: {
        id: documentId,
        vendorId,
      },
      include: {
        plant: true,
      },
    })
  },

  async cachePoItems(
    vendorId: string,
    entries: Array<{ item: BelPoItem; plantId: string; plantName: string }>,
  ): Promise<BelPoItemChoice[]> {
    const now = new Date()

    return prisma.$transaction(async (tx) => {
      const choices: BelPoItemChoice[] = []

      const keys = entries.map((entry) => ({
        poNumber: entry.item.poNumber,
        poItem: entry.item.poItem,
      }))

      for (const entry of entries) {
        const snapshot = entry.item as unknown as Prisma.InputJsonValue

        const doc = await tx.belDocument.upsert({
          where: {
            vendorId_poNumber_poItem: {
              vendorId,
              poNumber: entry.item.poNumber,
              poItem: entry.item.poItem,
            },
          },
          create: {
            vendorId,
            poNumber: entry.item.poNumber,
            poItem: entry.item.poItem,
            plantId: entry.plantId,
            snapshot,
            fetchedAt: now,
          },
          update: {
            plantId: entry.plantId,
            snapshot,
            fetchedAt: now,
          },
        })

        choices.push({
          ...entry.item,
          id: doc.id,
          plantId: entry.plantId,
          plantName: entry.plantName,
          reservedQuantity: '0',
          sapRemainingQuantity: '0',
          availableQuantity: '0',
        })
      }

      const reservedMap = await reservedByPoItem(tx, vendorId, keys)

      return choices.map((choice) => {
        const mapKey = choice.poNumber + ':' + choice.poItem
        const ordered = quantity(choice.orderedQuantity)
        const sapReceived = quantity(choice.sapReceivedQuantity)
        const sapRemaining = ordered > sapReceived ? ordered - sapReceived : 0n
        const reserved = reservedMap.get(mapKey) ?? 0n
        const available = sapRemaining > reserved ? sapRemaining - reserved : 0n

        return {
          ...choice,
          reservedQuantity: quantityText(reserved),
          sapRemainingQuantity: quantityText(sapRemaining),
          availableQuantity: quantityText(available),
        }
      })
    })
  },

  async list(query: BelListQuery, scope: BelScope) {
    const where: Prisma.BelRegistrationWhereInput = {
      AND: [scopeWhere(scope), searchWhere(query)],
    }

    const [total, rows] = await prisma.$transaction(
      [
        prisma.belRegistration.count({
          where,
        }),
        prisma.belRegistration.findMany({
          where,
          include: REQUEST_INCLUDE,
          orderBy: orderByFor(query),
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
      ],
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    )

    return {
      items: rows.map(mapBelSummary),
      total,
      page: query.page,
      limit: query.limit,
    }
  },

  async saveDraft(input: {
    id?: string
    vendorId: string
    actorId: string
    scope: BelScope
    version?: number
    prepared: PreparedBelLine[]
  }): Promise<StoredBelRequest> {
    return prisma.$transaction(async (tx) => {
      if (input.id) {
        await lockRegistration(tx, input.id)
      }

      const existing = input.id ? await findScoped(tx, input.id, input.scope) : null

      if (input.id && !existing) {
        throw new CustomError('BEL request was not found', 404)
      }

      if (existing) {
        assertVersion(existing.version, input.version)

        if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
          throw new CustomError('Only draft or rejected BEL requests can be edited', 409)
        }
      }

      await assertPoCapacity(tx, input.vendorId, input.prepared, existing?.id)

      const number =
        existing?.number ??
        'BEL-' + businessDate().replace(/-/g, '') + '-' + randomUUID().slice(0, 8).toUpperCase()

      if (existing) {
        await tx.belLine.deleteMany({
          where: {
            registrationId: existing.id,
          },
        })

        const updated = await tx.belRegistration.update({
          where: {
            id: existing.id,
          },
          data: {
            status: 'DRAFT',
            version: {
              increment: 1,
            },
            lines: {
              create: input.prepared.map((line) => ({
                documentId: line.documentId,
                documentSnapshot: line.documentSnapshot as unknown as Prisma.InputJsonValue,
                driverLicenseNumber: line.driverLicenseNumber,
                driverName: line.driverName,
                vehiclePlateNumber: line.vehiclePlateNumber,
                quantity: line.quantity,
                loadingDate: line.loadingDate,
                mediaTransport: line.mediaTransport,
                remark: line.remark,
                status: 'DRAFT',
              })),
            },
            history: {
              create: {
                actorId: input.actorId,
                action: 'UPDATED_DRAFT',
                details: {
                  lineCount: input.prepared.length,
                },
              },
            },
          },
          include: REQUEST_INCLUDE,
        })

        return updated
      }

      return tx.belRegistration.create({
        data: {
          number,
          vendorId: input.vendorId,
          createdById: input.actorId,
          status: 'DRAFT',
          lines: {
            create: input.prepared.map((line) => ({
              documentId: line.documentId,
              documentSnapshot: line.documentSnapshot as unknown as Prisma.InputJsonValue,
              driverLicenseNumber: line.driverLicenseNumber,
              driverName: line.driverName,
              vehiclePlateNumber: line.vehiclePlateNumber,
              quantity: line.quantity,
              loadingDate: line.loadingDate,
              mediaTransport: line.mediaTransport,
              remark: line.remark,
              status: 'DRAFT',
            })),
          },
          history: {
            create: {
              actorId: input.actorId,
              action: 'CREATED_DRAFT',
              details: {
                lineCount: input.prepared.length,
              },
            },
          },
        },
        include: REQUEST_INCLUDE,
      })
    })
  },

  async submit(input: {
    id: string
    actorId: string
    scope: BelScope
    version?: number
    prepared: PreparedBelLine[]
  }): Promise<StoredBelRequest> {
    return prisma.$transaction(async (tx) => {
      await lockRegistration(tx, input.id)

      const existing = await findScoped(tx, input.id, input.scope)

      if (!existing) {
        throw new CustomError('BEL request was not found', 404)
      }

      assertVersion(existing.version, input.version)

      if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
        throw new CustomError('Only draft or rejected BEL requests can be submitted', 409)
      }

      await assertPoCapacity(tx, existing.vendorId, input.prepared, existing.id)

      const now = new Date()

      return tx.belRegistration.update({
        where: {
          id: existing.id,
        },
        data: {
          status: 'SUBMITTED',
          submittedAt: now,
          version: {
            increment: 1,
          },
          lines: {
            updateMany: {
              where: {
                registrationId: existing.id,
              },
              data: {
                status: 'SUBMITTED',
              },
            },
          },
          history: {
            create: {
              actorId: input.actorId,
              action: 'SUBMITTED',
              details: {
                lineCount: input.prepared.length,
              },
            },
          },
        },
        include: REQUEST_INCLUDE,
      })
    })
  },

  async approve(input: {
    id: string
    actorId: string
    actorUsername: string
    scope: BelScope
    version?: number
    stage: (payloads: BelStagePayload[]) => Promise<'oracle' | 'local'>
  }): Promise<StoredBelRequest> {
    return prisma.$transaction(async (tx) => {
      await lockRegistration(tx, input.id)

      const existing = await findScoped(tx, input.id, input.scope)

      if (!existing) {
        throw new CustomError('BEL request was not found', 404)
      }

      assertVersion(existing.version, input.version)

      if (existing.status !== 'SUBMITTED') {
        throw new CustomError('Only submitted BEL requests can be approved', 409)
      }

      const submittedLines: PreparedBelLine[] = existing.lines
        .filter((line) => line.status === 'SUBMITTED')
        .map((line) => ({
          id: line.id,
          documentId: line.documentId,
          documentSnapshot: parseSnapshot(line.documentSnapshot),
          driverLicenseNumber: line.driverLicenseNumber,
          driverName: line.driverName,
          vehiclePlateNumber: line.vehiclePlateNumber,
          quantity: dbDecimal(line.quantity),
          loadingDate: line.loadingDate,
          mediaTransport: line.mediaTransport,
          remark: line.remark,
        }))

      if (!submittedLines.length) {
        throw new CustomError('BEL request has no submitted lines to approve', 409)
      }

      await assertPoCapacity(tx, existing.vendorId, submittedLines, existing.id)

      const now = new Date()
      const payloads = buildBelStagePayloads(existing, input.actorUsername, now, 'APPROVED')
      const stageMode = await input.stage(payloads)
      const payloadById = new Map(payloads.map((entry) => [entry.DET_ID, entry]))

      for (const line of submittedLines) {
        const lineId = line.id!
        const payload = payloadById.get(lineId)!

        await tx.belLine.update({
          where: {
            id: lineId,
          },
          data: {
            status: 'APPROVED',
            stagedAt: now,
            stagePayload: payload as unknown as Prisma.InputJsonValue,
            stageError: null,
          },
        })
      }

      return tx.belRegistration.update({
        where: {
          id: existing.id,
        },
        data: {
          status: 'APPROVED',
          decidedById: input.actorId,
          decidedAt: now,
          version: {
            increment: 1,
          },
          history: {
            create: {
              actorId: input.actorId,
              action: 'APPROVED',
              details: {
                stageMode,
                lineCount: payloads.length,
              },
            },
          },
        },
        include: REQUEST_INCLUDE,
      })
    }, ORACLE_TRANSACTION)
  },

  async reject(input: {
    id: string
    actorId: string
    actorUsername: string
    scope: BelScope
    reason: string
    version?: number
    stage: (payloads: BelStagePayload[]) => Promise<'oracle' | 'local'>
  }): Promise<StoredBelRequest> {
    return prisma.$transaction(async (tx) => {
      await lockRegistration(tx, input.id)

      const existing = await findScoped(tx, input.id, input.scope)

      if (!existing) {
        throw new CustomError('BEL request was not found', 404)
      }

      assertVersion(existing.version, input.version)

      if (existing.status !== 'SUBMITTED') {
        throw new CustomError('Only submitted BEL requests can be rejected', 409)
      }

      const now = new Date()
      const retracted = buildBelStagePayloads(existing, input.actorUsername, now, 'CANCELLED')

      if (retracted.length) {
        await input.stage(retracted)
      }

      return tx.belRegistration.update({
        where: {
          id: existing.id,
        },
        data: {
          status: 'REJECTED',
          decidedById: input.actorId,
          decidedAt: now,
          version: {
            increment: 1,
          },
          lines: {
            updateMany: {
              where: {
                registrationId: existing.id,
                status: 'SUBMITTED',
              },
              data: {
                status: 'REJECTED',
              },
            },
          },
          history: {
            create: {
              actorId: input.actorId,
              action: 'REJECTED',
              reason: input.reason,
            },
          },
        },
        include: REQUEST_INCLUDE,
      })
    }, ORACLE_TRANSACTION)
  },

  async cancel(input: {
    id: string
    actorId: string
    actorUsername: string
    scope: BelScope
    reason: string
    version?: number
    stage: (payloads: BelStagePayload[]) => Promise<'oracle' | 'local'>
  }): Promise<StoredBelRequest> {
    return prisma.$transaction(async (tx) => {
      await lockRegistration(tx, input.id)

      const existing = await findScoped(tx, input.id, input.scope)

      if (!existing) {
        throw new CustomError('BEL request was not found', 404)
      }

      assertVersion(existing.version, input.version)

      if (!['DRAFT', 'SUBMITTED', 'APPROVED'].includes(existing.status)) {
        throw new CustomError('BEL request cannot be cancelled in its current status', 409)
      }

      const now = new Date()
      const cancelPayloads = buildBelStagePayloads(existing, input.actorUsername, now, 'CANCELLED')

      if (cancelPayloads.length) {
        await input.stage(cancelPayloads)
      }

      return tx.belRegistration.update({
        where: {
          id: existing.id,
        },
        data: {
          status: 'CANCELLED',
          version: {
            increment: 1,
          },
          lines: {
            updateMany: {
              where: {
                registrationId: existing.id,
                status: {
                  in: ['DRAFT', 'SUBMITTED', 'APPROVED'],
                },
              },
              data: {
                status: 'CANCELLED',
              },
            },
          },
          history: {
            create: {
              actorId: input.actorId,
              action: 'CANCELLED',
              reason: input.reason,
              details: {
                unstagedCount: cancelPayloads.length,
              },
            },
          },
        },
        include: REQUEST_INCLUDE,
      })
    }, ORACLE_TRANSACTION)
  },
}
