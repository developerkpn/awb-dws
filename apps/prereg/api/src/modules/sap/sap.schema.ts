import { z } from 'zod'

export const sapEntities = [
  'DOKUNNRSet',
  'ZSLIPSet',
  'ZPINOSet',
  'OUTDELIVSet',
  'DOTRXDELETESet',
  'DOKUNNRSTOSet',
  'SOSTOSet',
  'DOSTOSet',
  'LIFSTOSet',
  'STOTYPESet',
  'SLOCSet',
  'VALTYPESet',
  'SIMSet',
  'TRUCKSet',
] as const

export const odataCollection = z.object({
  d: z.object({
    results: z.array(z.record(z.string(), z.unknown())).max(10000),
    __next: z.string().optional(),
  }),
})

export const documentSnapshot = z.object({
  referenceDocument: z.string(),
  contractNumber: z.string(),
  material: z.string(),
  description: z.string(),
  uom: z.string(),
  sapPlant: z.string(),
  company: z.string(),
  incoterm1: z.string(),
  incoterm2: z.string(),
  itemRule: z.string(),
  invoiceType: z.string(),
  invoiceToleranceUpper: z.string(),
  invoiceToleranceLower: z.string(),
  contractQuantity: z.string(),
  sapUsedQuantity: z.string(),
  deletedQuantity: z.string(),
  observedLoadingNotes: z.array(z.string()),
  paid: z.boolean(),
  unpaidAmount: z.string(),
  stoNumber: z.string().nullable(),
  transportType: z.string().nullable(),
  buyerReference: z.string().nullable().default(null),
  buyerName: z.string().nullable().default(null),
})

export const belPoSnapshot = z.object({
  vendorCode: z.string(),
  poType: z.string(),
  poNumber: z.string(),
  poItem: z.string(),
  material: z.string(),
  description: z.string(),
  uom: z.string(),
  sapPlant: z.string(),
  incoterm1: z.string(),
  orderedQuantity: z.string(),
  sapReceivedQuantity: z.string(),
  receivedUom: z.string(),
  sapShippedQuantity: z.string(),
  shippedUom: z.string(),
  completed: z.boolean(),
})
