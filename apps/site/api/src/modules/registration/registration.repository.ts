import type { RegistrationCreateData } from '@awb/contracts'
import { prisma } from '../../config/prisma'
import { Prisma } from '../../generated/prisma/client'
import type { RegistrationListFilter } from '../../types/registration'

const blank = (value: string) => value || null
const decimal = (value: string) => (value ? new Prisma.Decimal(value) : null)

const operatorName = {
  select: { name: true },
} as const

export const REGISTRATION_LIST_INCLUDE = {
  createdBy: operatorName,
  revisedBy: operatorName,
  cancelledBy: operatorName,
  checkedOutBy: operatorName,
  dos: {
    select: {
      doNumber: true,
      transactionCode: true,
      commodityName: true,
    },
    orderBy: { lineNumber: 'asc' },
  },
  destinations: {
    select: { code: true },
    orderBy: { lineNumber: 'asc' },
  },
} as const

function baseWhere(filter: RegistrationListFilter): Prisma.RegistrationWhereInput {
  const search = filter.search?.trim()

  return {
    AND: [
      filter.from
        ? {
            registeredAt: {
              gte: new Date(filter.from),
            },
          }
        : {},
      filter.to
        ? {
            registeredAt: {
              lte: new Date(filter.to),
            },
          }
        : {},
      search
        ? {
            OR: [
              {
                number: { contains: search },
              },
              {
                plateNumber: { contains: search },
              },
              {
                driverName: { contains: search },
              },
              {
                licenseNumber: { contains: search },
              },
              {
                deliveryNote: { contains: search },
              },
              {
                cardNumber: { contains: search },
              },
              {
                referenceNumber: { contains: search },
              },
            ],
          }
        : {},
    ],
  }
}

function nextNumber(tx: Prisma.TransactionClient) {
  return tx.counter.upsert({
    where: { key: 'registration' },
    create: {
      key: 'registration',
      value: 1,
    },
    update: {
      value: { increment: 1 },
    },
  })
}

export default {
  async list(filter: RegistrationListFilter) {
    const where = baseWhere(filter)

    const listWhere: Prisma.RegistrationWhereInput = {
      AND: [where, filter.status ? { status: filter.status } : {}],
    }

    const [items, total, groups] = await Promise.all([
      prisma.registration.findMany({
        where: listWhere,
        include: REGISTRATION_LIST_INCLUDE,
        orderBy: [{ [filter.sortBy]: filter.sortDirection }, { id: filter.sortDirection }],
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      prisma.registration.count({ where: listWhere }),
      prisma.registration.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ])

    return {
      items,
      total,
      groups,
    }
  },
  create(data: RegistrationCreateData, createdById: string) {
    const otherParty = data.hasOtherPartyWeight
      ? {
          otherPartyReference: blank(data.otherPartyReference),
          otherPartyWeighedAt: data.otherPartyWeighedAt ? new Date(data.otherPartyWeighedAt) : null,
          otherPartyGross: decimal(data.otherPartyGross),
          otherPartyTare: decimal(data.otherPartyTare),
          otherPartyNet: new Prisma.Decimal(data.otherPartyGross || 0).minus(
            data.otherPartyTare || 0,
          ),
        }
      : {}

    return prisma.$transaction(async (tx) => {
      const counter = await nextNumber(tx)

      return tx.registration.create({
        data: {
          number: 'GP' + String(counter.value).padStart(7, '0'),
          registeredAt: new Date(),
          cardNumber: blank(data.cardNumber),
          weighingType: data.weighingType,
          plateNumber: data.plateNumber,
          transporterCode: blank(data.transporterCode),
          transporterName: blank(data.transporterName),
          licenseNumber: blank(data.licenseNumber),
          driverName: blank(data.driverName),
          tankerNumber: blank(data.tankerNumber),
          passengerCount: data.passengerCount,
          passengerNames: blank(data.passengerNames),
          needsLastWeighingCheck: data.needsLastWeighingCheck,
          deliveryNote: blank(data.deliveryNote),
          isDifferentEstate: data.isDifferentEstate,
          isReturn: data.isReturn,
          sealNumber: blank(data.sealNumber),
          ticketRemark: blank(data.ticketRemark),
          reportRemark: blank(data.reportRemark),
          additionalInfo: blank(data.additionalInfo),
          needsContainerCheck: data.needsContainerCheck,
          hasOtherPartyWeight: data.hasOtherPartyWeight,
          ...otherParty,
          createdById,
          destinations: {
            create: data.destinations.map((destination, index) => ({
              lineNumber: index + 1,
              code: destination.code,
              name: blank(destination.name),
            })),
          },
          containers: {
            create: data.containers.map((container, index) => ({
              lineNumber: index + 1,
              containerNumber: container.containerNumber,
              sealNumber: blank(container.sealNumber),
            })),
          },
          dos: {
            create: data.dos.map((line, index) => ({
              lineNumber: index + 1,
              transactionCode: line.transactionCode.toUpperCase(),
              transactionName: blank(line.transactionName),
              doNumber: line.doNumber,
              piNumber: blank(line.piNumber),
              commodityCode: blank(line.commodityCode),
              commodityName: blank(line.commodityName),
              contractNumber: blank(line.contractNumber),
              relationCode: blank(line.relationCode),
              relationName: blank(line.relationName),
              transporterCode: blank(line.transporterCode),
              estate: blank(line.estate),
              otherPartyNet: decimal(line.otherPartyNet),
              factoryNet: decimal(line.factoryNet),
              loadingQuantity: decimal(line.loadingQuantity),
              otherPartyLoadingQuantity: decimal(line.otherPartyLoadingQuantity),
              soItem: blank(line.soItem),
              doSapNumber: blank(line.doSapNumber),
              doSapItem: blank(line.doSapItem),
              loadingNoteNumber: blank(line.loadingNoteNumber),
              loadingNoteItem: blank(line.loadingNoteItem),
              quantityKg: decimal(line.quantityKg),
              quantity: decimal(line.quantity),
              quantityUom: blank(line.quantityUom),
              baseQuantity: decimal(line.baseQuantity),
              baseUom: blank(line.baseUom),
              customerQq: blank(line.customerQq),
              stoNumber: blank(line.stoNumber),
              doStoNumber: blank(line.doStoNumber),
              deductions: {
                create: line.deductions.map((deduction, deductionIndex) => ({
                  lineNumber: deductionIndex + 1,
                  code: deduction.code,
                  name: blank(deduction.name),
                  percent: decimal(deduction.percent),
                  deductionKg: decimal(deduction.deductionKg),
                  unitQuantity: decimal(deduction.unitQuantity),
                  isReturn: deduction.isReturn,
                })),
              },
            })),
          },
          qualities: {
            create: data.qualities.map((quality, index) => ({
              lineNumber: index + 1,
              code: quality.code,
              name: blank(quality.name),
              sapSpecification: blank(quality.sapSpecification),
              estateValue: blank(quality.estateValue),
              factoryValue: blank(quality.factoryValue),
              netDeduction: blank(quality.netDeduction),
            })),
          },
        },
        select: {
          id: true,
          number: true,
        },
      })
    })
  },
}
