import { z } from 'zod'
import { sortDirection } from '../common/sorting'

/** Gate registration at the plant, with every input of the WB.NET "Registrasi Masuk" form. */
export const weighingTypes = ['2X', 'NX', 'NON'] as const
export const weighingType = z.enum(weighingTypes)
export type WeighingType = z.infer<typeof weighingType>

/** The truck moves through the stages of its plant flow; the status says how it is doing there. */
export const registrationStatuses = [
  'ACTIVE',
  'ON_HOLD',
  'REJECTED',
  'COMPLETED',
  'CANCELLED',
] as const
export const registrationStatus = z.enum(registrationStatuses)
export type RegistrationStatus = z.infer<typeof registrationStatus>

/** Stage codes of the plant flows, the same codes as VCF, in the order a truck meets them. */
export const flowStageCodes = [
  'regist_in',
  'wb_in',
  'inspection',
  'loading',
  'sampling',
  'lab',
  'unloading',
  'wb_out',
  'regist_out',
] as const
export type FlowStageCode = (typeof flowStageCodes)[number]

/** List tabs: open registrations by where the truck is, finished ones by status. */
export const registrationPhases = [
  'WB_IN',
  'PROCESS',
  'WB_OUT',
  'REGIST_OUT',
  'COMPLETED',
  'CANCELLED',
] as const
export const registrationPhase = z.enum(registrationPhases)
export type RegistrationPhase = z.infer<typeof registrationPhase>

export const openRegistrationStatuses = ['ACTIVE', 'ON_HOLD', 'REJECTED'] as const

export const registrationPhaseStages = {
  WB_IN: ['regist_in', 'wb_in'],
  PROCESS: ['inspection', 'loading', 'sampling', 'lab', 'unloading'],
  WB_OUT: ['wb_out'],
  REGIST_OUT: ['regist_out'],
} as const satisfies Partial<Record<RegistrationPhase, readonly FlowStageCode[]>>

export function registrationPhaseOf(status: string, stageCode: string): RegistrationPhase {
  if (status === 'COMPLETED' || status === 'CANCELLED') return status

  const phase = (
    Object.keys(registrationPhaseStages) as (keyof typeof registrationPhaseStages)[]
  ).find((key) => (registrationPhaseStages[key] as readonly string[]).includes(stageCode))

  return phase ?? 'PROCESS'
}

const text = (max: number) => z.string().trim().max(max).default('')
const code = (max: number) => z.string().trim().toUpperCase().max(max).default('')

const requiredCode = (max: number, message: string) =>
  z.string().trim().toUpperCase().min(1, message).max(max)

/** Photos come from the camera only, as a JPEG of at most 960 px, well under this limit. */
export const registrationPhotoMaxLength = 1_500_000
export const registrationPhotoPattern = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/

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
    cardNumber: code(30),
    driverPhoto: z
      .string()
      .max(registrationPhotoMaxLength, 'The photo is too large; take it again')
      .default(''),
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
    // WB.NET's checks on Simpan, in its order, plus the plant console's photo and card.
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

    // One truck follows one flow, and the flow comes from the transaction type.
    if (new Set(value.dos.map((line) => line.transactionCode).filter(Boolean)).size > 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'All DOs on one truck must have the same transaction type',
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

    if (!value.driverPhoto) {
      ctx.addIssue({
        code: 'custom',
        message: 'Take a photo of the driver',
        path: ['driverPhoto'],
      })
    } else if (!registrationPhotoPattern.test(value.driverPhoto)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Take the driver photo with the camera',
        path: ['driverPhoto'],
      })
    }

    // The driver taps this card at every stage, so no truck may enter without one.
    if (!value.cardNumber) {
      ctx.addIssue({
        code: 'custom',
        message: 'Tap the RFID card on the reader or type its number',
        path: ['cardNumber'],
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
  phase: registrationPhase.optional(),
  sortBy: z.enum(registrationSortFields).default('registeredAt'),
  sortDirection: sortDirection.default('desc'),
})
export type RegistrationListQuery = z.input<typeof registrationListQuery>

export const registrationCardNumber = requiredCode(30, 'Enter the card number')

/** Whether a card is still held by a registration that has not finished. */
export interface RegistrationCardStatus {
  cardNumber: string
  heldBy: {
    id: string
    number: string
    plateNumber: string
  } | null
}

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
  transporterName: string | null
  weighingType: WeighingType
  otherPartyNet: string | null
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
  hasDriverPhoto: boolean
  flow: RegistrationFlow
  stage: RegistrationStage
  dos: RegistrationListDo[]
  destinations: string[]
}

export interface RegistrationFlow {
  code: string
  name: string
}

export interface RegistrationStage {
  code: string
  name: string
  step: number
  steps: number
}

export interface RegistrationListDo {
  doNumber: string
  transactionCode: string
  commodityCode: string | null
  commodityName: string | null
  relationName: string | null
}

export type RegistrationCounts = Record<RegistrationPhase, number> & { all: number }

export interface RegistrationListResult {
  items: RegistrationListItem[]
  total: number
  counts: RegistrationCounts
}

export interface RegistrationCreated {
  id: string
  number: string
}
