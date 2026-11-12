import { z } from 'zod'
import { sortDirection } from '../common/sorting'

/** Gate registration at the plant, with every input of the WB.NET "Registrasi Masuk" form. */
export const weighingTypes = ['2X', 'NX', 'NON'] as const
export const weighingType = z.enum(weighingTypes)
export type WeighingType = z.infer<typeof weighingType>

export const registrationStatuses = ['OPEN', 'CHECKED_OUT', 'CANCELLED'] as const
export const registrationStatus = z.enum(registrationStatuses)
export type RegistrationStatus = z.infer<typeof registrationStatus>

const text = (max: number) => z.string().trim().max(max).default('')
const code = (max: number) => z.string().trim().toUpperCase().max(max).default('')

const requiredCode = (max: number, message: string) =>
  z.string().trim().toUpperCase().min(1, message).max(max)

const decimal = z
  .string()
  .trim()
  .regex(/^(\d{1,12}(\.\d{1,3})?)?$/, 'Enter a number (up to 3 decimals)')
  .default('')

export const registrationDestinationInput = z.object({
  code: requiredCode(20, 'Enter the destination code'),
  name: text(100),
})

export const registrationContainerInput = z.object({
  containerNumber: requiredCode(30, 'Enter the container number'),
  sealNumber: text(50),
})

export const registrationDeductionInput = z.object({
  code: requiredCode(20, 'Enter the deduction code'),
  name: text(100),
  percent: decimal,
  deductionKg: decimal,
  unitQuantity: decimal,
  isReturn: z.boolean().default(false),
})

export const registrationDoInput = z
  .object({
    transactionCode: requiredCode(10, 'Choose the transaction type'),
    transactionName: text(100),
    doNumber: requiredCode(50, 'Enter the DO number'),
    piNumber: text(50),
    commodityCode: text(30),
    commodityName: text(100),
    contractNumber: text(50),
    relationCode: code(20),
    relationName: text(150),
    transporterCode: code(20),
    estate: text(100),
    otherPartyNet: decimal,
    factoryNet: decimal,
    loadingQuantity: decimal,
    otherPartyLoadingQuantity: decimal,
    soItem: text(10),
    doSapNumber: text(20),
    doSapItem: text(10),
    loadingNoteNumber: text(20),
    loadingNoteItem: text(10),
    quantityKg: decimal,
    quantity: decimal,
    quantityUom: code(10),
    baseQuantity: decimal,
    baseUom: code(10),
    customerQq: text(150),
    stoNumber: text(20),
    doStoNumber: text(20),
    deductions: z.array(registrationDeductionInput).max(50).default([]),
  })
  .superRefine((value, ctx) => {
    // A sale cannot be registered without its SAP loading note.
    if (value.transactionCode.toUpperCase() === 'JUL' && !value.loadingNoteNumber) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter the loading note for a sale (JUL)',
        path: ['loadingNoteNumber'],
      })
    }
  })

export const registrationQualityInput = z.object({
  code: requiredCode(20, 'Enter the QC code'),
  name: text(100),
  sapSpecification: text(50),
  estateValue: text(30),
  factoryValue: text(30),
  netDeduction: text(30),
})

export const registrationCreateInput = z
  .object({
    cardNumber: text(30),
    weighingType: weighingType.default('2X'),
    plateNumber: code(20),
    transporterCode: code(20),
    transporterName: text(150),
    licenseNumber: text(30),
    driverName: text(150),
    tankerNumber: code(30),
    passengerCount: z.coerce.number().int().min(0).max(99).default(0),
    passengerNames: text(500),
    needsLastWeighingCheck: z.boolean().default(false),
    destinations: z.array(registrationDestinationInput).max(20).default([]),
    deliveryNote: text(50),
    isDifferentEstate: z.boolean().default(false),
    isReturn: z.boolean().default(false),
    sealNumber: text(100),
    ticketRemark: text(250),
    reportRemark: text(250),
    additionalInfo: text(250),
    containers: z.array(registrationContainerInput).max(50).default([]),
    needsContainerCheck: z.boolean().default(false),
    hasOtherPartyWeight: z.boolean().default(false),
    otherPartyReference: text(50),
    otherPartyWeighedAt: z.union([z.iso.datetime({ offset: true }), z.literal('')]).default(''),
    otherPartyGross: decimal,
    otherPartyTare: decimal,
    dos: z.array(registrationDoInput).max(50).default([]),
    qualities: z.array(registrationQualityInput).max(50).default([]),
  })
  .superRefine((value, ctx) => {
    // Same checks, in the same order, as WB.NET on Simpan.
    if (!value.plateNumber) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter the truck plate',
        path: ['plateNumber'],
      })
    }

    if (!value.licenseNumber) {
      ctx.addIssue({
        code: 'custom',
        message: 'Pick the driver',
        path: ['licenseNumber'],
      })
    }

    if (!value.dos.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Add at least one DO',
        path: ['dos'],
      })
    }

    if (!value.destinations.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Add at least one destination',
        path: ['destinations'],
      })
    }

    if (value.hasOtherPartyWeight) {
      const gross = Number(value.otherPartyGross || 0)
      const tare = Number(value.otherPartyTare || 0)

      if (gross <= 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter the gross weight from the other-party ticket',
          path: ['otherPartyGross'],
        })
      } else if (tare > gross) {
        ctx.addIssue({
          code: 'custom',
          message: 'Tare cannot be more than gross',
          path: ['otherPartyTare'],
        })
      }
    }
  })

export type RegistrationCreateInput = z.input<typeof registrationCreateInput>
export type RegistrationCreateData = z.output<typeof registrationCreateInput>
export type RegistrationDoInput = z.input<typeof registrationDoInput>
export type RegistrationDeductionInput = z.input<typeof registrationDeductionInput>
export type RegistrationDestinationInput = z.input<typeof registrationDestinationInput>
export type RegistrationContainerInput = z.input<typeof registrationContainerInput>
export type RegistrationQualityInput = z.input<typeof registrationQualityInput>

export const registrationSortFields = [
  'registeredAt',
  'number',
  'plateNumber',
  'driverName',
  'status',
] as const
export type RegistrationSortField = (typeof registrationSortFields)[number]

export const registrationListQuery = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  status: registrationStatus.optional(),
  sortBy: z.enum(registrationSortFields).default('registeredAt'),
  sortDirection: sortDirection.default('desc'),
})
export type RegistrationListQuery = z.input<typeof registrationListQuery>

export interface RegistrationListItem {
  id: string
  number: string
  cardNumber: string | null
  registeredAt: string
  referenceNumber: string | null
  checkedOutBy: string | null
  checkedOutAt: string | null
  plateNumber: string
  tankerNumber: string | null
  licenseNumber: string | null
  driverName: string | null
  transporterCode: string | null
  deliveryNote: string | null
  sealNumber: string | null
  ticketRemark: string | null
  createdBy: string | null
  createdAt: string
  revisedBy: string | null
  revisedAt: string | null
  cancelledBy: string | null
  cancelledAt: string | null
  status: RegistrationStatus
  dos: RegistrationListDo[]
  destinations: string[]
}

export interface RegistrationListDo {
  doNumber: string
  transactionCode: string
  commodityName: string | null
}

export interface RegistrationCounts {
  all: number
  open: number
  checkedOut: number
  cancelled: number
}

export interface RegistrationListResult {
  items: RegistrationListItem[]
  total: number
  counts: RegistrationCounts
}

export interface RegistrationCreated {
  id: string
  number: string
}
