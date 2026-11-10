import { CustomError } from '@awb/server-core'
import type { JulDocument } from '@awb/contracts'
import { legacyPaymentAmount, quantity, quantityText } from '../../lib/quantity'
import { licenseKey, plateKey } from '../../lib/master-data'
import repository, { odataLiteral } from './sap.repository'
import type { SapEntity, SapOwner, SapPaging, SapRow } from '../../types/sap'
import type { SapDriver, SapVehicle } from '../../types/sapMaster'

const field = (row: SapRow, name: string) =>
  String(
    Object.entries(row).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ?? '',
  ).trim()

const eq = (name: string, value: string) => name + ' eq ' + odataLiteral(value)

const sapDriver = (row: SapRow): SapDriver => ({
  licenseNumber: licenseKey(field(row, 'Snosim')),
  name: field(row, 'Snama'),
  location: field(row, 'ZwbLoc') || null,
})

const sapVehicle = (row: SapRow): SapVehicle => ({
  plateNumber: plateKey(field(row, 'Nnopolisi')),
  location: field(row, 'ZwbLoc') || null,
})

const read = (
  entity: SapEntity,
  filter: string,
  owner: SapOwner,
  values: Record<string, string> = {},
) => repository.read(entity, '(' + filter + ')', owner, values)

export default {
  async references(owner: SapOwner, sto?: string): Promise<string[]> {
    if (owner.role === 'VENDOR') {
      if (!sto) return []

      const owned = await read(
        'LIFSTOSet',
        eq('Lifnr', owner.username) + ' and ' + eq('Ebeln', sto),
        owner,
        { sto },
      )

      if (
        !owned.some((row) => field(row, 'Ebeln') === sto && field(row, 'Lifnr') === owner.username)
      )
        throw new CustomError('STO does not belong to this account', 403)

      return (await read('DOSTOSet', eq('Ebeln', sto), owner, { sto }))
        .map((row) => field(row, 'ZzvbelnV1'))
        .filter(Boolean)
    }

    return (await read('DOKUNNRSet', eq('Kunnr', owner.username), owner))
      .map((row) => field(row, 'Vbeln'))
      .filter(Boolean)
  },

  async slip(owner: SapOwner, reference: string) {
    const slip = (await read('ZSLIPSet', eq('Vbeln', reference), owner, { reference }))[0]

    return slip
      ? {
          incoterm1: field(slip, 'Inco1'),
          sapPlant: field(slip, 'Werks'),
        }
      : null
  },

  async document(owner: SapOwner, reference: string, sto?: string): Promise<JulDocument> {
    const references = await this.references(owner, sto)

    if (!references.includes(reference))
      throw new CustomError('Document does not belong to this account', 403)

    if (sto && owner.role !== 'VENDOR') {
      const owned = await this.stos(owner, reference)

      if (!owned.includes(sto))
        throw new CustomError('STO is not available for this customer and DO', 403)
    }

    const values = { reference }
    const slip = (await read('ZSLIPSet', eq('Vbeln', reference), owner, values))[0]

    if (!slip) throw new CustomError('SAP document was not found', 404)

    const payments = await read('ZPINOSet', eq('Vbeln', reference), owner, values)

    if (!payments.length) throw new CustomError('SAP payment data is incomplete', 502)

    const deliveries = await read('OUTDELIVSet', eq('Vbeln', reference), owner, values)
    const deleted = await read('DOTRXDELETESet', eq('VbelnRef', reference), owner, values)

    const paid = payments.reduce(
      (sum, row) =>
        sum +
        ['Wrbtr', 'Zpiph', 'Zpipn'].reduce(
          (amount, key) => amount + legacyPaymentAmount(field(row, key)),
          0n,
        ),
      0n,
    )

    const unpaid = legacyPaymentAmount(field(slip, 'Zttlprof')) - paid
    let stoNumber = sto ?? null
    let transportType: string | null = null

    if (stoNumber) {
      const associated = await read('DOSTOSet', eq('Ebeln', stoNumber), owner, { sto: stoNumber })

      if (!associated.some((row) => field(row, 'ZzvbelnV1') === reference))
        throw new CustomError('DO is not associated with this STO', 422)

      transportType =
        field(
          (await read('STOTYPESet', eq('Ebeln', stoNumber), owner, { sto: stoNumber }))[0] ?? {},
          'ZztransType',
        ) || null
    }

    if (owner.role !== 'VENDOR' && !stoNumber && field(slip, 'Inco1') === 'FRC') {
      const associated = await read('SOSTOSet', eq('Bednr', reference), owner, values)

      stoNumber = field(associated[0] ?? {}, 'Ebeln') || null

      if (stoNumber) {
        const docs = await read('DOSTOSet', eq('Ebeln', stoNumber), owner, { sto: stoNumber })

        if (!docs.some((row) => field(row, 'ZzvbelnV1') === reference))
          throw new CustomError('SAP returned inconsistent STO data', 502)

        transportType =
          field(
            (await read('STOTYPESet', eq('Ebeln', stoNumber), owner, { sto: stoNumber }))[0] ?? {},
            'ZztransType',
          ) || null
      }
    }

    const sapPlant = field(slip, 'Werks')
    const buyerReference = field(slip, 'Vbeln')
    const isB2b = Boolean(buyerReference) && buyerReference !== reference

    return {
      referenceDocument: reference,
      contractNumber: field(slip, 'Ctrno'),
      material: field(slip, 'Matnr'),
      description: field(slip, 'Maktx'),
      uom: field(slip, 'Vrkme'),
      sapPlant,
      company: sapPlant.slice(0, 2),
      incoterm1: field(slip, 'Inco1'),
      incoterm2: field(slip, 'Inco2'),
      itemRule: field(slip, 'Itemrule'),
      invoiceType: field(slip, 'Zzinvoicetype'),
      invoiceToleranceUpper: field(slip, 'Uebtoinv'),
      invoiceToleranceLower: field(slip, 'Unttoinv'),
      contractQuantity: quantityText(quantity(field(slip, 'Kwmeng'))),
      sapUsedQuantity: quantityText(
        deliveries.reduce(
          (sum, row) =>
            sum +
            (quantity(field(row, 'LLfimg') || '0') !== 0n
              ? quantity(field(row, 'LLfimg'))
              : quantity(field(row, 'PlnLfimg') || '0')),
          0n,
        ),
      ),
      deletedQuantity: quantityText(
        deleted.reduce((sum, row) => sum + quantity(field(row, 'PlnLfimg') || '0'), 0n),
      ),
      observedLoadingNotes: deliveries.map((row) => field(row, 'Zdconr')).filter(Boolean),
      paid: unpaid <= 5000n,
      unpaidAmount: unpaid.toString(),
      stoNumber,
      transportType,
      buyerReference: isB2b ? buyerReference : null,
      buyerName: isB2b ? field(slip, 'Name1') || null : null,
    }
  },

  async driver(owner: SapOwner, licenseNumber: string): Promise<SapDriver | null> {
    const rows = await read('SIMSet', eq('Snosim', licenseNumber), owner, { q: licenseNumber })

    return rows.map(sapDriver).find((row) => row.licenseNumber === licenseNumber) ?? null
  },

  async driversPage(paging: SapPaging) {
    return (await repository.page('SIMSet', paging)).map(sapDriver)
  },

  async stos(owner: SapOwner, reference: string) {
    if (!(await this.references(owner)).includes(reference))
      throw new CustomError('Document does not belong to this account', 403)

    return (
      await read(
        'DOKUNNRSTOSet',
        eq('Vbeln', reference) + ' and ' + eq('Kunnr', owner.username),
        owner,
        { reference },
      )
    )
      .map((row) => field(row, 'Ebeln'))
      .filter(Boolean)
  },

  async vehicle(owner: SapOwner, plateNumber: string): Promise<SapVehicle | null> {
    const rows = await read('TRUCKSet', eq('Nnopolisi', plateNumber), owner, { q: plateNumber })

    return rows.map(sapVehicle).find((row) => row.plateNumber === plateNumber) ?? null
  },

  async vehiclesPage(paging: SapPaging) {
    return (await repository.page('TRUCKSet', paging)).map(sapVehicle)
  },
}
