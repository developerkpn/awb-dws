import type { RegistrationCreateInput, RegistrationDoInput } from '@awb/contracts'

export function emptyRegistration(): RegistrationCreateInput {
  return {
    cardNumber: '',
    weighingType: '2X',
    plateNumber: '',
    transporterCode: '',
    transporterName: '',
    licenseNumber: '',
    driverName: '',
    tankerNumber: '',
    passengerCount: 0,
    passengerNames: '',
    needsLastWeighingCheck: false,
    destinations: [],
    deliveryNote: '',
    isDifferentEstate: false,
    isReturn: false,
    sealNumber: '',
    ticketRemark: '',
    reportRemark: '',
    additionalInfo: '',
    containers: [],
    needsContainerCheck: false,
    // Left unanswered on purpose: the operator must say whether there is an other-party ticket.
    hasOtherPartyWeight: undefined,
    otherPartyReference: '',
    otherPartyWeighedAt: '',
    otherPartyGross: '',
    otherPartyTare: '',
    dos: [],
    qualities: [],
  }
}

export function emptyDo(): RegistrationDoInput {
  return {
    transactionCode: '',
    transactionName: '',
    doNumber: '',
    piNumber: '',
    commodityCode: '',
    commodityName: '',
    contractNumber: '',
    relationCode: '',
    relationName: '',
    transporterCode: '',
    estate: '',
    otherPartyNet: '',
    factoryNet: '',
    loadingQuantity: '',
    otherPartyLoadingQuantity: '',
    soItem: '',
    doSapNumber: '',
    doSapItem: '',
    loadingNoteNumber: '',
    loadingNoteItem: '',
    quantityKg: '',
    quantity: '',
    quantityUom: '',
    baseQuantity: '',
    baseUom: '',
    customerQq: '',
    stoNumber: '',
    doStoNumber: '',
    deductions: [],
  }
}

export const WEIGHING_TYPE_OPTIONS = [
  {
    value: '2X',
    label: 'Twice',
    description: 'Weighed in and out',
  },
  {
    value: 'NX',
    label: 'Multiple',
    description: 'More than two weighings',
  },
  {
    value: 'NON',
    label: 'No weighing',
    description: 'Skips the weighbridge',
  },
] as const

export function formatKg(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 3 })
}

export function sumDecimal(values: (string | undefined)[]) {
  return values.reduce((sum, value) => sum + (Number(value) || 0), 0)
}
