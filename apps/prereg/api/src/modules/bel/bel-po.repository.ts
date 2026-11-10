import type { BelPoItem } from '@awb/contracts'
import { CustomError } from '@awb/server-core'
import { env } from '../../config/env'
import { quantity, quantityText } from '../../lib/quantity'
import { odataLiteral } from '../sap/sap.repository'
import { odataCollection } from '../sap/sap.schema'
import type { SapRow } from '../../types/sap'

const field = (row: SapRow, name: string) =>
  String(
    Object.entries(row).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ?? '',
  ).trim()

const safeQuantity = (raw: string) => quantityText(quantity(raw || '0'))

export function isEligiblePoRow(row: SapRow, vendorCode: string) {
  const lifnr = field(row, 'Lifnr')
  const poType = field(row, 'Bsart').toUpperCase()
  const material = field(row, 'Matnr')
  const completed = field(row, 'Elikz').toUpperCase() === 'X'

  if (lifnr && lifnr !== vendorCode) return false

  if (!poType.endsWith('10')) return false

  if (!material.startsWith('8')) return false

  return !completed
}

export function parsePoRows(rows: SapRow[], vendorCode: string): BelPoItem[] {
  return rows
    .filter((row) => isEligiblePoRow(row, vendorCode))
    .map((row) => {
      const material = field(row, 'Matnr')
      const description = field(row, 'Txz01') || field(row, 'Maktx') || 'Material ' + material
      const uom = field(row, 'Meins') || 'KG'

      return {
        vendorCode: field(row, 'Lifnr') || vendorCode,
        poType: field(row, 'Bsart').toUpperCase(),
        poNumber: field(row, 'Ebeln'),
        poItem: field(row, 'Ebelp'),
        material,
        description,
        uom,
        sapPlant: field(row, 'Werks'),
        incoterm1: field(row, 'Inco1'),
        orderedQuantity: safeQuantity(field(row, 'Menge')),
        sapReceivedQuantity: safeQuantity(field(row, 'Erfmg')),
        receivedUom: field(row, 'Erfme') || uom,
        sapShippedQuantity: safeQuantity(field(row, 'Lsmng')),
        shippedUom: field(row, 'Lsmeh') || uom,
        completed: false,
      }
    })
}

export function mockPoRows(vendorCode: string): SapRow[] {
  return [
    {
      Lifnr: vendorCode,
      Bsart: 'ZM10',
      Ebeln: '4500000001',
      Ebelp: '00010',
      Matnr: '8000001001',
      Txz01: 'Crude Palm Oil (CPO)',
      Elikz: '',
      Erfmg: '850.000',
      Erfme: 'KG',
      Lsmng: '850.000',
      Lsmeh: 'KG',
      Menge: '1500.000',
      Meins: 'KG',
      Inco1: 'FRC',
      Werks: 'PS23',
    },
    {
      Lifnr: vendorCode,
      Bsart: 'ZM10',
      Ebeln: '4500000001',
      Ebelp: '00020',
      Matnr: '8000001002',
      Txz01: 'RBD Palm Olein',
      Elikz: '',
      Erfmg: '0.000',
      Erfme: 'KG',
      Lsmng: '0.000',
      Lsmeh: 'KG',
      Menge: '500.000',
      Meins: 'KG',
      Inco1: 'FRC',
      Werks: 'PS21',
    },
    {
      Lifnr: vendorCode,
      Bsart: 'ZR10',
      Ebeln: '4500000002',
      Ebelp: '00010',
      Matnr: '8000002001',
      Txz01: 'Palm Fatty Acid Distillate (PFAD)',
      Elikz: '',
      Erfmg: '400.000',
      Erfme: 'KG',
      Lsmng: '400.000',
      Lsmeh: 'KG',
      Menge: '2000.000',
      Meins: 'KG',
      Inco1: 'CIF',
      Werks: 'EU21',
    },
    {
      Lifnr: vendorCode,
      Bsart: 'ZM10',
      Ebeln: '4500000001',
      Ebelp: '00030',
      Matnr: '8000001003',
      Txz01: 'Completed PO Item (Excluded)',
      Elikz: 'X',
      Erfmg: '300.000',
      Erfme: 'KG',
      Lsmng: '300.000',
      Lsmeh: 'KG',
      Menge: '300.000',
      Meins: 'KG',
      Inco1: 'FRC',
      Werks: 'PS23',
    },
    {
      Lifnr: vendorCode,
      Bsart: 'ZM10',
      Ebeln: '4500000003',
      Ebelp: '00010',
      Matnr: '1000000999',
      Txz01: 'Non-Trade Material (Excluded)',
      Elikz: '',
      Erfmg: '0.000',
      Erfme: 'KG',
      Lsmng: '0.000',
      Lsmeh: 'KG',
      Menge: '100.000',
      Meins: 'KG',
      Inco1: 'FRC',
      Werks: 'PS23',
    },
    {
      Lifnr: vendorCode,
      Bsart: 'NB',
      Ebeln: '4500000004',
      Ebelp: '00010',
      Matnr: '8000004001',
      Txz01: 'Standard PO Type NB (Excluded)',
      Elikz: '',
      Erfmg: '0.000',
      Erfme: 'KG',
      Lsmng: '0.000',
      Lsmeh: 'KG',
      Menge: '250.000',
      Meins: 'KG',
      Inco1: 'FRC',
      Werks: 'PS23',
    },
  ]
}

export default {
  async listByVendor(vendorCode: string): Promise<BelPoItem[]> {
    if (!env.SAP_PO_API_URL) {
      if (env.NODE_ENV === 'production') {
        throw new CustomError('SAP PO API URL is not configured', 503)
      }

      const mock = odataCollection.parse({
        d: {
          results: mockPoRows(vendorCode),
        },
      })

      return parsePoRows(mock.d.results, vendorCode)
    }

    const url = new URL(env.SAP_PO_API_URL)

    url.searchParams.set('$format', 'json')

    if (!url.searchParams.has('$filter')) {
      url.searchParams.set('$filter', 'Lifnr eq ' + odataLiteral(vendorCode))
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    if (env.SAP_SERVICE_USERNAME && env.SAP_SERVICE_PASSWORD) {
      headers.Authorization =
        'Basic ' +
        Buffer.from(env.SAP_SERVICE_USERNAME + ':' + env.SAP_SERVICE_PASSWORD).toString('base64')
    }

    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(env.SAP_REQUEST_TIMEOUT_MS),
      redirect: 'error',
    }).catch(() => {
      throw new CustomError('SAP PO lookup is unavailable', 502)
    })

    if (!response.ok) {
      throw new CustomError('SAP PO lookup failed (HTTP ' + response.status + ')', 502)
    }

    const parsed = odataCollection.safeParse(await response.json())

    if (!parsed.success || parsed.data.d.__next) {
      throw new CustomError('SAP returned an unsupported or incomplete PO collection', 502)
    }

    return parsePoRows(parsed.data.d.results, vendorCode)
  },
}
