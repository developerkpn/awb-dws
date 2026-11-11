import { randomUUID } from 'node:crypto'
import { CustomError } from '@awb/server-core'
import type { JulDocument } from '@awb/contracts'
import { prisma } from '../../config/prisma'
import type { Prisma } from '../../generated/prisma/client'
import { quantity, quantityText } from '../../lib/quantity'
import type { Tx, JulScope, PreparedLine } from '../../types/jul'
import type { StagePayload, StageResult } from '../../types/sap'
import type { JulListQuery } from '../../types/jul'

const PROVIDER_MODE = 'live'
const json = (value: unknown) => value as Prisma.InputJsonValue

const include = {
  jobs: {
    orderBy: { createdAt: 'desc' },
  },
  customer: {
    select: {
      id: true,
      name: true,
      username: true,
    },
  },
  lines: {
    include: {
      document: {
        include: { plant: true },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  history: {
    include: {
      actor: {
        select: { name: true },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 100,
  },
} satisfies Prisma.JulRegistrationInclude

const scoped = (scope: JulScope): Prisma.JulRegistrationWhereInput => ({
  ...(scope.customerId ? { customerId: scope.customerId } : {}),
  ...(scope.plantIds
    ? {
        lines: {
          every: {
            document: {
              plantId: { in: scope.plantIds },
            },
          },
        },
      }
    : {}),
})

const inFlight = ['APPROVED', 'SAP_PENDING', 'SAP_UNKNOWN']
const reviewable = ['SUBMITTED', 'SAP_RETRY']
const reserving = ['DRAFT', ...reviewable, ...inFlight, 'COMPLETED']

async function lock(tx: Tx, references: string[]) {
  for (const reference of [...new Set(references)].sort())
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${PROVIDER_MODE + ':' + reference}), 71)`
}

async function capacity(tx: Tx, document: JulDocument, excluding?: string) {
  const totals = await tx.julLine.aggregate({
    where: {
      document: {
        referenceDocument: document.referenceDocument,
        providerMode: PROVIDER_MODE,
      },
      status: { in: reserving },
      OR: [
        { loadingNoteNumber: null },
        {
          loadingNoteNumber: { notIn: document.observedLoadingNotes },
        },
      ],
      ...(excluding
        ? {
            registrationId: { not: excluding },
          }
        : {}),
    },
    _sum: { quantity: true },
  })

  const reserved = quantity(totals._sum.quantity?.toString() ?? '0')

  const hold = await tx.julHold.findUnique({
    where: {
      providerMode_referenceDocument: {
        providerMode: PROVIDER_MODE,
        referenceDocument: document.referenceDocument,
      },
    },
  })

  const held = quantity(hold?.quantity.toString() ?? '0')

  return {
    reserved,
    held,
    available:
      quantity(document.contractQuantity) -
      quantity(document.sapUsedQuantity) +
      quantity(document.deletedQuantity) -
      reserved -
      held,
  }
}

async function assertCapacity(tx: Tx, lines: PreparedLine[], excluding?: string) {
  for (const ref of new Set(lines.map((line) => line.documentSnapshot.referenceDocument))) {
    const selected = lines.filter((line) => line.documentSnapshot.referenceDocument === ref)
    const current = await capacity(tx, selected[0]!.documentSnapshot, excluding)

    if (selected.reduce((sum, line) => sum + quantity(line.quantity), 0n) > current.available)
      throw new CustomError('Quantity exceeds the available balance for ' + ref, 409)
  }
}

async function aggregate(tx: Tx, id: string) {
  const lines = await tx.julLine.findMany({
    where: { registrationId: id },
    select: { status: true },
  })

  const states = lines.map((line) => line.status)

  const status = states.every((s) => s === 'COMPLETED')
    ? 'COMPLETED'
    : states.some((s) => inFlight.includes(s))
      ? 'PROCESSING'
      : states.every((s) => s === 'DRAFT')
        ? 'DRAFT'
        : states.every((s) => reviewable.includes(s))
          ? 'SUBMITTED'
          : states.every((s) => s === 'CANCELLED')
            ? 'CANCELLED'
            : states.every((s) => s === 'EXPIRED')
              ? 'EXPIRED'
              : 'PARTIAL'

  await tx.julRegistration.update({
    where: { id },
    data: {
      status,
      version: { increment: 1 },
    },
  })
}

export default {
  user(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
        isActive: true,
      },
      include: {
        role: true,
        plants: true,
      },
    })
  },
  customers() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          code: 'CUSTOMER',
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: {
          select: { code: true },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: 100,
    })
  },
  plant(document: JulDocument) {
    return prisma.plant.findFirst({
      where: {
        isActive: true,
        sapPlantCode: document.sapPlant,
      },
    })
  },
  document(id: string) {
    return prisma.julDocument.findUnique({
      where: { id },
      include: {
        customer: {
          include: { role: true },
        },
        plant: true,
      },
    })
  },
  cache(customerId: string, plantId: string, snapshot: JulDocument) {
    return prisma.julDocument.upsert({
      where: {
        customerId_providerMode_referenceDocument: {
          customerId,
          providerMode: PROVIDER_MODE,
          referenceDocument: snapshot.referenceDocument,
        },
      },
      create: {
        customerId,
        providerMode: PROVIDER_MODE,
        plantId,
        referenceDocument: snapshot.referenceDocument,
        snapshot: json(snapshot),
      },
      update: {
        plantId,
        snapshot: json(snapshot),
        fetchedAt: new Date(),
      },
    })
  },
  balance(document: JulDocument) {
    return prisma.$transaction((tx) => capacity(tx, document))
  },
  rules(plantId: string, material: string, incoterm: string) {
    return prisma.julPlantRule.findUnique({
      where: {
        plantId_material_incoterm: {
          plantId,
          material,
          incoterm,
        },
      },
    })
  },
  async downstreamPlants(codes: string[]) {
    const plants = await prisma.plant.findMany({
      where: {
        isActive: true,
        companyGroup: 'DOWNSTREAM',
        sapPlantCode: { in: codes },
      },
      select: { sapPlantCode: true },
    })

    return new Set(plants.map((plant) => plant.sapPlantCode))
  },
  async loadingNoteType(incoterm: string) {
    return (
      (
        await prisma.julLoadingNoteType.findUnique({
          where: { incoterm },
        })
      )?.type ?? null
    )
  },
  transportModes() {
    return prisma.julTransportMode.findMany({
      where: { isActive: true },
      select: {
        code: true,
        name: true,
      },
      orderBy: { code: 'asc' },
    })
  },
  find(id: string, scope: JulScope) {
    return prisma.julRegistration.findFirst({
      where: {
        id,
        ...scoped(scope),
      },
      include,
    })
  },
  async list(query: JulListQuery, scope: JulScope) {
    const where: Prisma.JulRegistrationWhereInput = {
      ...scoped(scope),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                number: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                customer: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                lines: {
                  some: {
                    document: {
                      referenceDocument: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    }

    const orderBy =
      query.sortBy === 'customer'
        ? {
            customer: { name: query.sortDirection },
          }
        : { [query.sortBy]: query.sortDirection }

    const [rows, total] = await prisma.$transaction(
      [
        prisma.julRegistration.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            lines: {
              select: {
                status: true,
                document: {
                  select: { referenceDocument: true },
                },
              },
            },
          },
          orderBy: [orderBy, { id: query.sortDirection }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        prisma.julRegistration.count({ where }),
      ],
      { isolationLevel: 'RepeatableRead' },
    )

    return {
      rows,
      total,
    }
  },
  async save(
    customerId: string,
    actorId: string,
    lines: PreparedLine[],
    id?: string,
    version?: number,
    isMulti = false,
  ) {
    return prisma.$transaction(
      async (tx) => {
        if (id) {
          const changed = await tx.julRegistration.updateMany({
            where: {
              id,
              customerId,
              version,
              status: 'DRAFT',
            },
            data: {
              version: { increment: 1 },
            },
          })

          if (!changed.count) throw new CustomError('Draft changed; reload before saving', 409)
        }

        const old = id
          ? await tx.julLine.findMany({
              where: { registrationId: id },
              include: { document: true },
            })
          : []

        await lock(tx, [
          ...lines.map((line) => line.documentSnapshot.referenceDocument),
          ...old.map((line) => line.document.referenceDocument),
        ])

        await assertCapacity(tx, lines, id)

        const request = id
          ? { id }
          : await tx.julRegistration.create({
              data: {
                customerId,
                createdById: actorId,
                providerMode: PROVIDER_MODE,
                isMulti,
                number: 'JUL-' + randomUUID().toUpperCase(),
              },
            })

        if (id)
          await tx.julLine.deleteMany({
            where: { registrationId: id },
          })

        for (const line of lines)
          await tx.julLine.create({
            data: {
              ...line,
              documentSnapshot: json(line.documentSnapshot),
              registrationId: request.id,
            },
          })

        await tx.julHistory.create({
          data: {
            registrationId: request.id,
            actorId,
            action: id ? 'DRAFT_UPDATED' : 'DRAFT_CREATED',
          },
        })

        return request.id
      },
      { timeout: 15000 },
    )
  },
  async submit(id: string, version: number, actorId: string, lines: PreparedLine[]) {
    await prisma.$transaction(
      async (tx) => {
        const updated = await tx.julRegistration.updateMany({
          where: {
            id,
            version,
            status: 'DRAFT',
            providerMode: PROVIDER_MODE,
          },
          data: {
            status: 'SUBMITTED',
            submittedAt: new Date(),
            version: { increment: 1 },
          },
        })

        if (!updated.count) throw new CustomError('Draft changed; reload before submitting', 409)

        await lock(
          tx,
          lines.map((line) => line.documentSnapshot.referenceDocument),
        )

        await assertCapacity(tx, lines, id)
        for (const line of lines)
          await tx.julLine.update({
            where: {
              id: line.id!,
              registrationId: id,
            },
            data: {
              ...line,
              documentSnapshot: json(line.documentSnapshot),
              status: 'SUBMITTED',
            },
          })

        await tx.julHistory.create({
          data: {
            registrationId: id,
            actorId,
            action: 'SUBMITTED',
          },
        })
      },
      { timeout: 15000 },
    )
  },
  async cancel(id: string, version: number, actorId: string, reason: string) {
    await prisma.$transaction(async (tx) => {
      const changed = await tx.julRegistration.updateMany({
        where: {
          id,
          version,
          status: {
            in: ['DRAFT', 'SUBMITTED', 'PARTIAL'],
          },
        },
        data: {
          version: { increment: 1 },
        },
      })

      if (!changed.count) throw new CustomError('Request changed; reload before cancelling', 409)

      await tx.julLine.updateMany({
        where: {
          registrationId: id,
          status: {
            in: ['DRAFT', ...reviewable, 'SAP_FAILED'],
          },
        },
        data: { status: 'CANCELLED' },
      })

      await aggregate(tx, id)

      await tx.julHistory.create({
        data: {
          registrationId: id,
          actorId,
          action: 'CANCELLED',
          reason,
        },
      })
    })
  },
  async approve(
    id: string,
    version: number,
    actorId: string,
    operatorUsername: string,
    lines: PreparedLine[],
    payloads: StagePayload[],
  ) {
    return prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${operatorUsername}), 72)`

        const busy = await tx.julJob.count({
          where: {
            operatorUsername,
            providerMode: PROVIDER_MODE,
            status: {
              notIn: ['COMPLETED', 'FAILED', 'RETRY'],
            },
          },
        })

        if (busy)
          throw new CustomError('Resolve this SAP operator’s pending loading-note job first', 409)

        const changed = await tx.julRegistration.updateMany({
          where: {
            id,
            version,
            providerMode: PROVIDER_MODE,
          },
          data: {
            version: { increment: 1 },
          },
        })

        if (!changed.count) throw new CustomError('Request changed; reload before approving', 409)

        await lock(
          tx,
          lines.map((line) => line.documentSnapshot.referenceDocument),
        )

        const all = await tx.julLine.findMany({
          where: { registrationId: id },
          include: { document: true },
        })

        for (const line of lines)
          if (!all.some((row) => row.id === line.id && reviewable.includes(row.status)))
            throw new CustomError('Only submitted or retryable lines can be approved', 409)

        const pending = all
          .filter((line) => {
            const fresh = lines.find(
              (selected) =>
                selected.documentSnapshot.referenceDocument === line.document.referenceDocument,
            )?.documentSnapshot

            return (
              fresh &&
              reserving.includes(line.status) &&
              !(
                line.loadingNoteNumber &&
                fresh.observedLoadingNotes.includes(line.loadingNoteNumber)
              )
            )
          })
          .map((line) => ({
            ...line,
            quantity: line.quantity.toString(),
            documentSnapshot:
              lines.find(
                (fresh) =>
                  fresh.documentSnapshot.referenceDocument === line.document.referenceDocument,
              )?.documentSnapshot ?? (line.documentSnapshot as unknown as JulDocument),
          }))

        await assertCapacity(tx, pending, id)

        const job = await tx.julJob.create({
          data: {
            registrationId: id,
            operatorUsername,
            providerMode: PROVIDER_MODE,
            payload: json(payloads),
          },
        })

        for (const line of lines) {
          const payload = payloads.find((row) => row.DET_ID === line.id)!

          await tx.julLine.update({
            where: { id: line.id! },
            data: {
              status: 'APPROVED',
              sapError: null,
              quantity: payload.PLN_LFIMG,
              jobId: job.id,
              documentSnapshot: json(line.documentSnapshot),
              factoryStorage: payload.DLGORT,
              otherStorage: payload.RLGORT,
              factoryValuation: payload.DBWTAR,
              otherValuation: payload.RBWTAR_1,
              factoryBatch: payload.DCHARG_1,
              otherBatch: payload.RCHARG_1,
            },
          })
        }

        await aggregate(tx, id)

        await tx.julHistory.create({
          data: {
            registrationId: id,
            actorId,
            action: 'APPROVED',
            details: {
              lineIds: lines.map((line) => line.id!),
            },
          },
        })

        return job
      },
      { timeout: 15000 },
    )
  },
  job(id: string) {
    return prisma.julJob.findUnique({
      where: { id },
      include: { lines: true },
    })
  },
  async claimStage(id: string) {
    return (
      (
        await prisma.julJob.updateMany({
          where: {
            id,
            providerMode: PROVIDER_MODE,
            status: {
              in: ['QUEUED', 'STAGE_FAILED'],
            },
            triggerStartedAt: null,
          },
          data: {
            status: 'STAGING',
            error: null,
          },
        })
      ).count === 1
    )
  },
  stageFailed(id: string) {
    return prisma.julJob.updateMany({
      where: {
        id,
        status: 'STAGING',
        triggerStartedAt: null,
      },
      data: {
        status: 'STAGE_FAILED',
        error: 'Staging was interrupted; reauthorize to resume safely',
      },
    })
  },
  async markTrigger(id: string) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.julJob.updateMany({
        where: {
          id,
          status: 'STAGING',
          triggerStartedAt: null,
        },
        data: {
          status: 'PENDING',
          triggerStartedAt: new Date(),
          nextPollAt: new Date(),
        },
      })

      if (result.count)
        await tx.julLine.updateMany({
          where: {
            jobId: id,
            status: 'APPROVED',
          },
          data: { status: 'SAP_PENDING' },
        })

      return result.count === 1
    })
  },
  async uncertain(id: string) {
    await prisma.$transaction(async (tx) => {
      await tx.julJob.updateMany({
        where: {
          id,
          status: 'PENDING',
        },
        data: {
          status: 'UNKNOWN',
          error: 'SAP trigger outcome is uncertain; reconciliation continues',
        },
      })

      await tx.julLine.updateMany({
        where: {
          jobId: id,
          status: 'SAP_PENDING',
        },
        data: { status: 'SAP_UNKNOWN' },
      })
    })
  },
  async reconcile(id: string, results: StageResult[]) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}), 73)`

      const job = await tx.julJob.findUniqueOrThrow({
        where: { id },
        include: { lines: true },
      })

      if (!job.triggerStartedAt || ['COMPLETED', 'FAILED'].includes(job.status)) return

      let changes = 0

      for (const result of results) {
        const line = job.lines.find((row) => row.id === result.id)

        if (!line || ![...inFlight, 'SAP_RETRY'].includes(line.status)) continue

        if (result.loadingNoteNumber) {
          await tx.julLine.update({
            where: { id: line.id },
            data: {
              status: 'COMPLETED',
              loadingNoteNumber: result.loadingNoteNumber,
              sapError: null,
            },
          })

          changes++
        } else if (result.error) {
          const transient = /process(?:ed)? by/i.test(result.error)
          const status = transient ? 'SAP_RETRY' : 'SAP_FAILED'

          if (line.status === status && line.sapError === result.error) continue

          await tx.julLine.update({
            where: { id: line.id },
            data: {
              status,
              sapError: result.error,
            },
          })

          changes++
        }
      }

      const states = (
        await tx.julLine.findMany({
          where: { jobId: id },
          select: { status: true },
        })
      ).map((line) => line.status)

      const status = states.every((state) => state === 'COMPLETED')
        ? 'COMPLETED'
        : states.some((state) => inFlight.includes(state))
          ? job.status
          : states.includes('SAP_RETRY')
            ? 'RETRY'
            : 'FAILED'

      await tx.julJob.update({
        where: { id },
        data: {
          status,
          attempts: { increment: 1 },
          nextPollAt: new Date(Date.now() + 30000),
          error:
            status === 'RETRY'
              ? 'SAP returned a temporary error; push the affected allocations again'
              : ['COMPLETED', 'FAILED'].includes(status)
                ? null
                : job.error,
        },
      })

      if (changes) {
        await aggregate(tx, job.registrationId)

        await tx.julHistory.create({
          data: {
            registrationId: job.registrationId,
            action: 'SAP_RECONCILED',
            details: { changedLines: changes },
          },
        })
      }
    })
  },
  due() {
    return prisma.julJob.findMany({
      where: {
        providerMode: PROVIDER_MODE,
        status: {
          in: ['PENDING', 'UNKNOWN', 'RETRY'],
        },
        nextPollAt: {
          lte: new Date(),
        },
      },
      orderBy: [{ nextPollAt: 'asc' }, { id: 'asc' }],
      take: 20,
    })
  },
  async recoverStages() {
    await prisma.julJob.updateMany({
      where: {
        status: 'STAGING',
        triggerStartedAt: null,
        updatedAt: {
          lt: new Date(Date.now() - 900000),
        },
      },
      data: {
        status: 'STAGE_FAILED',
        error: 'Staging was interrupted; reauthorize to resume safely',
      },
    })
  },
  async expire(cutoff: Date) {
    const older: Prisma.JulLineWhereInput = {
      OR: [
        {
          loadingDate: { lt: cutoff },
        },
        {
          loadingDate: null,
          createdAt: {
            lt: new Date(cutoff.getTime() - 7 * 3600000),
          },
        },
      ],
    }

    const candidates = await prisma.julLine.findMany({
      where: {
        status: {
          in: ['DRAFT', ...reviewable],
        },
        ...older,
      },
      select: {
        id: true,
        registrationId: true,
      },
      take: 200,
      orderBy: { id: 'asc' },
    })

    for (const id of new Set(candidates.map((line) => line.registrationId)))
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT id FROM awb_jul_registration WHERE id = ${id}::uuid FOR UPDATE`

        const changed = await tx.julLine.updateMany({
          where: {
            id: {
              in: candidates.filter((line) => line.registrationId === id).map((line) => line.id),
            },
            status: {
              in: ['DRAFT', ...reviewable],
            },
            ...older,
          },
          data: { status: 'EXPIRED' },
        })

        if (changed.count) {
          await aggregate(tx, id)

          await tx.julHistory.create({
            data: {
              registrationId: id,
              action: 'EXPIRED',
            },
          })
        }
      })
  },
  async hold(document: JulDocument, actorId: string, amount: string, reason: string) {
    await prisma.$transaction(async (tx) => {
      await lock(tx, [document.referenceDocument])
      const balance = await capacity(tx, document)

      if (quantity(amount) > balance.available + balance.held)
        throw new CustomError('Hold exceeds the available balance', 409)

      await tx.julHold.upsert({
        where: {
          providerMode_referenceDocument: {
            providerMode: PROVIDER_MODE,
            referenceDocument: document.referenceDocument,
          },
        },
        create: {
          providerMode: PROVIDER_MODE,
          referenceDocument: document.referenceDocument,
          quantity: amount,
          actorId,
          reason,
        },
        update: {
          quantity: amount,
          actorId,
          reason,
        },
      })
    })
  },
}

export { quantityText }
