import { createHash } from 'node:crypto'
import { CustomError } from '@awb/server-core'
import { prisma } from '../src/config/prisma'
import gateway from '../src/modules/sap/sap.repository'
import staging from '../src/modules/sap/sap-stage.repository'
import type { SapEntity, SapMasterEntity, SapOwner, SapRow, StagePayload } from '../src/types/sap'

export function fixtureReferences(owner: SapOwner) {
  const known = ['CU00010000', 'AT11000001'].includes(owner.username.toUpperCase())

  const base = known
    ? 10000000
    : 100000000 +
      Number(
        BigInt('0x' + createHash('sha256').update(owner.username).digest('hex').slice(0, 10)) %
          800000000n,
      )

  return [1, 2, 3, 4, 5].map((index) => String(base + index).padStart(10, '0'))
}

export function fixtureRows(
  entity: SapEntity,
  owner: SapOwner,
  values: Record<string, string>,
): SapRow[] {
  const refs = fixtureReferences(owner)
  const reference = values.reference ?? refs[0]!
  const index = refs.indexOf(reference)

  if (entity === 'DOKUNNRSet')
    return refs.map((Vbeln) => ({
      Vbeln,
      Kunnr: owner.username,
    }))

  if (entity === 'ZSLIPSet')
    return index < 0
      ? []
      : [
          {
            Vbeln: reference,
            Ctrno: 'DEMO-CONTRACT-' + (index + 1),
            Matnr: '800000000' + (index + 1),
            Maktx: 'Development sample material ' + (index + 1),
            Werks: '3701',
            Vrkme: 'KG',
            Inco1: index === 1 ? 'FRC' : index === 4 ? 'CIF' : 'LCO',
            Inco2: 'DEMO',
            Itemrule: '1B',
            Zzinvoicetype: 'Q',
            Uebtoinv: '0',
            Unttoinv: '0',
            Kwmeng: '100000.000',
            Zttlprof: '100.000',
            Name1: 'Development buyer ' + (index + 1),
          },
        ]

  if (entity === 'ZPINOSet')
    return [
      {
        Wrbtr: index === 2 ? '94.999' : index === 3 ? '95.000' : '100.000',
        Zpiph: '0',
        Zpipn: '0',
      },
    ]

  if (entity === 'OUTDELIVSet')
    return [
      {
        PlnLfimg: '10000.000',
        LLfimg: '0.000',
        Zdconr: 'DEMO-EXTERNAL-' + reference,
      },
    ]

  if (entity === 'DOTRXDELETESet') return [{ PlnLfimg: '1000.000' }]

  if (entity === 'LIFSTOSet')
    return values.sto === '4500000001'
      ? [
          {
            Ebeln: values.sto,
            Lifnr: owner.username,
          },
        ]
      : []

  if (entity === 'DOSTOSet')
    return values.sto === '4500000001'
      ? [
          {
            Ebeln: values.sto,
            ZzvbelnV1: refs[1],
          },
        ]
      : []

  if (entity === 'STOTYPESet') return values.sto === '4500000001' ? [{ ZztransType: 'M' }] : []

  if (entity === 'SOSTOSet' || entity === 'DOKUNNRSTOSet')
    return reference === refs[1] ? [{ Ebeln: '4500000001' }] : []

  if (entity === 'SIMSet')
    return [
      {
        Snosim: '8800000000000001',
        Snama: 'Demo Driver One',
        ZwbLoc: 'PS1',
      },
      {
        Snosim: '8800000000000002',
        Snama: 'Demo Driver Two',
        ZwbLoc: 'PS1',
      },
    ].filter(
      (row) =>
        !values.q ||
        row.Snosim.includes(values.q) ||
        row.Snama.toLowerCase().includes(values.q.toLowerCase()),
    )

  if (entity === 'TRUCKSet')
    return [
      {
        Nnopolisi: 'B 1001 DEMO',
        ZwbLoc: 'PS1',
      },
      {
        Nnopolisi: 'B 1002 DEMO',
        ZwbLoc: 'PS1',
      },
    ].filter((row) => !values.q || row.Nnopolisi.toLowerCase().includes(values.q.toLowerCase()))

  if (entity === 'SLOCSet')
    return [
      {
        Lgort: 'D001',
        Lgobe: 'Demo factory',
        Factoryind: 'X',
        Otpartyind: '',
      },
      {
        Lgort: 'D002',
        Lgobe: 'Demo other party',
        Factoryind: '',
        Otpartyind: 'X',
      },
    ]

  if (entity === 'VALTYPESet') return [{ Bwtar: 'DEMO-FAC' }, { Bwtar: 'DEMO-OTH' }]

  return []
}

export const stagedRows = new Map<
  string,
  { payload: StagePayload; loadingNoteNumber: string | null; error: string | null }
>()

export function setStageError(ids: string[], error: string) {
  for (const id of ids) {
    const row = stagedRows.get(id)

    if (row) row.error = error
  }
}

export async function simulateCompletion(ids: string[]) {
  for (const id of ids) {
    const row = stagedRows.get(id)

    if (row && !row.loadingNoteNumber) {
      row.loadingNoteNumber = 'DEMO-JUL-' + id.replaceAll('-', '').slice(-12).toUpperCase()
      row.error = null
    }
  }
}

export async function seedTestJulRules(plantId: string) {
  for (let index = 1; index <= 5; index++) {
    const material = '800000000' + index

    for (const incoterm of ['LCO', 'FRC']) {
      await prisma.julPlantRule.upsert({
        where: {
          plantId_material_incoterm: {
            plantId,
            material,
            incoterm,
          },
        },
        create: {
          plantId,
          material,
          incoterm,
          factoryStorage: 'D001',
          otherStorage: 'D002',
          factoryValuation: 'DEMO-FAC',
          otherValuation: 'DEMO-OTH',
        },
        update: {
          factoryStorage: 'D001',
          otherStorage: 'D002',
          factoryValuation: 'DEMO-FAC',
          otherValuation: 'DEMO-OTH',
        },
      })
    }
  }
}

const mockOwner = {
  id: '00000000-0000-7000-8000-000000000000',
  username: 'SAP-MOCK',
  role: 'CUSTOMER',
}

export const masterPages: Partial<Record<SapMasterEntity, SapRow[]>> = {}

export function installSapMock() {
  let activeStageIds: string[] = []

  gateway.read = async (entity, _filter, owner, values = {}) => {
    if (!owner) return []

    const rows = fixtureRows(entity, owner, values)

    if (entity === 'OUTDELIVSet')
      for (const row of stagedRows.values())
        if (row.loadingNoteNumber && row.payload.VBELN_REF === values.reference)
          rows.push({
            PlnLfimg: row.payload.PLN_LFIMG,
            LLfimg: '0',
            Zdconr: row.loadingNoteNumber,
          })

    return rows
  }

  gateway.page = async (entity, paging) =>
    (masterPages[entity] ?? fixtureRows(entity, mockOwner, {})).slice(
      paging.skip,
      paging.skip + paging.top,
    )

  gateway.trigger = async (_operator, password) => {
    if (!password) throw new CustomError('Enter your SAP password to create loading notes', 422)

    await simulateCompletion(activeStageIds)
  }

  staging.stage = async (payloads: StagePayload[]) => {
    activeStageIds = payloads.map((payload) => payload.DET_ID)

    for (const payload of payloads) {
      const existing = stagedRows.get(payload.DET_ID)

      if (!existing)
        stagedRows.set(payload.DET_ID, {
          payload,
          loadingNoteNumber: null,
          error: null,
        })
      else if (payload.FLAG === 'U')
        Object.assign(existing, {
          payload,
          error: null,
        })
    }
  }

  staging.acknowledge = async () => undefined

  staging.results = async (ids) =>
    ids.flatMap((id) => {
      const row = stagedRows.get(id)

      return row
        ? [
            {
              id,
              loadingNoteNumber: row.loadingNoteNumber,
              error: row.error,
            },
          ]
        : []
    })
}
