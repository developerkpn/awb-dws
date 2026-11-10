import type {
  JulApprovalChoices,
  JulDocument,
  JulRequestDetail,
  JulRequestSummary,
  SessionUser,
} from '@awb/contracts'
import { CustomError, NotFoundError } from '@awb/server-core'
import { businessDate, quantity, quantityText } from '../../lib/quantity'
import { licenseKey, plateKey } from '../../lib/master-data'
import sap from '../sap/sap.service'
import sapMaster from '../sap-master/sap-master.service'
import gateway from '../sap/sap.repository'
import staging from '../sap/sap-stage.repository'
import { documentSnapshot } from '../sap/sap.schema'
import repository from './jul.repository'
import type { SapOwner, StagePayload } from '../../types/sap'
import type {
  ApprovalBody,
  DraftBody,
  JulListQuery,
  JulScope,
  PreparedLine,
  StoredRequest,
} from '../../types/jul'

const internal = (user: SessionUser) => ['ADMIN', 'LOGISTIC', 'COMMERCIAL'].includes(user.role)

const reviewer = (user: SessionUser) =>
  user.role === 'ADMIN' || (user.role === 'LOGISTIC' && user.permissions.includes('prereg:approve'))

const assertReviewer = (user: SessionUser) => {
  if (!reviewer(user)) throw new CustomError('Logistics approval permission required', 403)
}

async function scope(user: SessionUser): Promise<JulScope> {
  if (!internal(user)) return { customerId: user.id }

  if (user.role === 'ADMIN') return {}

  const actor = await repository.user(user.id)

  return {
    plantIds: actor?.plants.map((plant) => plant.plantId) ?? [],
  }
}

async function owner(user: SessionUser, customerId?: string): Promise<SapOwner> {
  if (!internal(user) && customerId && customerId !== user.id)
    throw new CustomError('Use your own customer account', 403)

  const id = internal(user) ? customerId : user.id

  if (!id) throw new CustomError('Choose a customer or vendor', 422)

  const customer = await repository.user(id)

  if (!customer || !['CUSTOMER', 'VENDOR'].includes(customer.role.code))
    throw new CustomError('Choose an active customer or vendor', 422)

  return {
    id: customer.id,
    username: customer.username,
    role: customer.role.code,
  }
}

async function checkPlant(user: SessionUser, plantId: string) {
  if (user.role === 'ADMIN') return

  const actor = await repository.user(user.id)

  if (!actor?.plants.some((plant) => plant.plantId === plantId))
    throw new CustomError('This plant is outside your access', 403)
}

async function freshDocument(id: string, user: SessionUser, customer: SapOwner, sto?: string) {
  const cached = await repository.document(id)

  if (!cached || cached.customerId !== customer.id) throw new NotFoundError('Document not found')

  await checkPlant(user, cached.plantId)

  if (cached.plant.companyGroup !== 'DOWNSTREAM')
    throw new CustomError('This plant is not configured for downstream JUL', 422)

  const prior = documentSnapshot.parse(cached.snapshot)

  const document = await sap.document(
    customer,
    cached.referenceDocument,
    sto ?? (customer.role === 'VENDOR' ? (prior.stoNumber ?? undefined) : undefined),
  )

  if (document.sapPlant !== prior.sapPlant || document.material !== prior.material)
    throw new CustomError('SAP document changed; refresh the document selection', 409)

  await repository.cache(customer.id, cached.plantId, document)

  return {
    cached,
    document,
  }
}

async function modes() {
  const active = await repository.transportModes()

  if (!active.length) throw new CustomError('No transport mode is active', 422)

  return active.sort((a, b) => Number(b.code === 'T') - Number(a.code === 'T'))
}

async function prepare(
  body: DraftBody,
  user: SessionUser,
  customer: SapOwner,
  submitting: boolean,
): Promise<PreparedLine[]> {
  const documents = new Map<string, JulDocument>()
  const lines: PreparedLine[] = []

  for (const input of body.lines) {
    const key = input.documentId + ':' + (input.stoNumber ?? '')
    let document = documents.get(key)

    if (!document) {
      document = (await freshDocument(input.documentId, user, customer, input.stoNumber)).document
      documents.set(key, document)
    }

    if (!document.paid)
      throw new CustomError('Down payment is not sufficient for ' + document.referenceDocument, 422)

    const expected =
      customer.role === 'VENDOR' ? 'FRC' : document.incoterm1 === 'FRC' ? 'FRC_TO_LCO' : 'LCO'

    if (input.variant !== expected)
      throw new CustomError('Choose the matching downstream JUL variant', 422)

    if (expected !== 'LCO' && !document.stoNumber)
      throw new CustomError('This variant requires an associated STO', 422)

    if (!(await modes()).some((mode) => mode.code === input.mediaTransport))
      throw new CustomError('Transport mode is not active', 422)

    if (quantity(input.quantity) <= 0n) throw new CustomError('Enter a positive quantity', 422)

    let driverName: string | null = null

    if (submitting) {
      if (!input.driverLicenseNumber || !input.vehiclePlateNumber || !input.loadingDate)
        throw new CustomError('Complete driver, vehicle and loading date before submitting', 422)

      if (input.loadingDate < businessDate())
        throw new CustomError('Loading date cannot be in the past', 422)

      const driver = await sapMaster.driver(customer, input.driverLicenseNumber)

      if (!driver) throw new CustomError('Driver license is not registered in SAP', 422)

      driverName = driver.name

      if (!(await sapMaster.vehicle(customer, input.vehiclePlateNumber)))
        throw new CustomError('Vehicle is not registered in SAP', 422)
    }

    lines.push({
      id: input.id,
      documentId: input.documentId,
      documentSnapshot: document,
      variant: input.variant,
      stoNumber:
        input.variant === 'FRC_TO_LCO' || customer.role === 'VENDOR' ? document.stoNumber : null,
      driverLicenseNumber: input.driverLicenseNumber ? licenseKey(input.driverLicenseNumber) : null,
      driverName,
      vehiclePlateNumber: input.vehiclePlateNumber ? plateKey(input.vehiclePlateNumber) : null,
      quantity: quantityText(quantity(input.quantity)),
      loadingDate: input.loadingDate ? new Date(input.loadingDate) : null,
      mediaTransport: input.mediaTransport,
      remark: input.remark || null,
    })
  }

  if (
    !body.isMulti &&
    new Set(lines.map((line) => line.documentSnapshot.referenceDocument)).size > 1
  )
    throw new CustomError(
      'A JUL registration covers one delivery order; use a multi-DO trip for several',
      422,
    )

  if (body.isMulti) {
    if (customer.role === 'VENDOR' || lines.some((line) => line.variant !== 'LCO'))
      throw new CustomError('Multi-DO trips are for customer LCO delivery orders', 422)

    if (lines.length < 2)
      throw new CustomError('A multi-DO trip requires at least two delivery orders', 422)

    if (new Set(lines.map((line) => line.documentSnapshot.referenceDocument)).size !== lines.length)
      throw new CustomError('Cannot request the same delivery order twice in a multi-DO trip', 422)

    if (new Set(lines.map((line) => line.documentSnapshot.sapPlant)).size > 1)
      throw new CustomError('All delivery orders in a multi-DO trip must be on the same plant', 422)

    const first = lines[0]!

    if (
      lines.some(
        (line) =>
          line.driverLicenseNumber !== first.driverLicenseNumber ||
          line.vehiclePlateNumber !== first.vehiclePlateNumber ||
          line.loadingDate?.getTime() !== first.loadingDate?.getTime() ||
          line.mediaTransport !== first.mediaTransport,
      )
    )
      throw new CustomError(
        'All delivery orders in a multi-DO trip must share one vehicle, driver, loading date and transport mode',
        422,
      )
  }

  return lines
}

function summary(row: {
  id: string
  number: string
  status: string
  version: number
  customer: { id: string; name: string; username: string }
  isMulti: boolean
  createdAt: Date
  lines: { status: string; document: { referenceDocument: string } }[]
}): JulRequestSummary {
  return {
    id: row.id,
    number: row.number,
    status: row.status as JulRequestSummary['status'],
    version: row.version,
    customer: row.customer,
    documents: [...new Set(row.lines.map((line) => line.document.referenceDocument))],
    lineCount: row.lines.length,
    completedCount: row.lines.filter((line) => line.status === 'COMPLETED').length,
    createdAt: row.createdAt.toISOString(),
    isMulti: row.isMulti,
  }
}

function detail(row: StoredRequest, user: SessionUser): JulRequestDetail {
  return {
    ...summary(row),
    jobs: row.jobs.map((job) => ({
      id: job.id,
      status: job.status,
      error: job.error,
      canResume:
        reviewer(user) &&
        job.operatorUsername === user.username &&
        !job.triggerStartedAt &&
        ['QUEUED', 'STAGE_FAILED'].includes(job.status),
    })),
    lines: row.lines.map((line) => {
      const snapshot = documentSnapshot.parse(line.documentSnapshot)

      return {
        id: line.id,
        documentId: line.documentId,
        referenceDocument: snapshot.referenceDocument,
        contractNumber: snapshot.contractNumber,
        material: snapshot.material,
        description: snapshot.description,
        plantName: line.document.plant.name,
        sapPlant: snapshot.sapPlant,
        uom: snapshot.uom,
        variant: line.variant as JulRequestDetail['lines'][number]['variant'],
        stoNumber: line.stoNumber,
        driverLicenseNumber: line.driverLicenseNumber,
        driverName: line.driverName,
        vehiclePlateNumber: line.vehiclePlateNumber,
        quantity: line.quantity.toString(),
        loadingDate: line.loadingDate?.toISOString().slice(0, 10) ?? null,
        mediaTransport: line.mediaTransport,
        remark: line.remark,
        status: line.status as JulRequestDetail['lines'][number]['status'],
        loadingNoteNumber: line.loadingNoteNumber,
        sapError: line.sapError,
        factoryStorage: line.factoryStorage,
        otherStorage: line.otherStorage,
        factoryValuation: line.factoryValuation,
        otherValuation: line.otherValuation,
        jobId: line.jobId,
      }
    }),
    history: row.history.map((entry) => ({
      id: entry.id,
      action: entry.action,
      reason: entry.reason,
      actor: entry.actor?.name ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
  }
}

async function stored(id: string, user: SessionUser) {
  const row = await repository.find(id, await scope(user))

  if (!row) throw new NotFoundError('JUL registration not found')

  return row
}

async function choices(documentId: string, user: SessionUser): Promise<JulApprovalChoices> {
  assertReviewer(user)
  const cached = await repository.document(documentId)

  if (!cached) throw new NotFoundError('Document not found')

  await checkPlant(user, cached.plantId)

  const snapshot = (await freshDocument(documentId, user, await owner(user, cached.customerId)))
    .document

  const balance = await repository.balance(snapshot)
  const rule = await repository.rules(cached.plantId, snapshot.material, snapshot.incoterm1)

  if (!rule)
    throw new CustomError(
      'Storage and valuation rules are not configured for this plant/material',
      422,
    )

  return {
    factoryStorage: [
      {
        code: rule.factoryStorage,
        name: rule.factoryStorage,
      },
    ],
    paymentEligible: snapshot.paid,
    availableQuantity: quantityText(balance.available),
    reservedQuantity: quantityText(balance.reserved),
    heldQuantity: quantityText(balance.held),
    uom: snapshot.uom,
    otherStorage: [
      {
        code: rule.otherStorage,
        name: rule.otherStorage,
      },
    ],
    factoryValuation: [rule.factoryValuation],
    otherValuation: [rule.otherValuation],
    factoryBatch: snapshot.company,
    otherBatch: snapshot.referenceDocument,
  }
}

async function reconcileJob(id: string) {
  const job = await repository.job(id)

  if (!job || !job.triggerStartedAt || ['COMPLETED', 'FAILED'].includes(job.status)) return

  const results = await staging.results(job.lines.map((line) => line.id))

  await staging.acknowledge(results)
  await repository.reconcile(id, results)
}

async function runJob(id: string, password?: string) {
  const job = await repository.job(id)

  if (!job) throw new NotFoundError('SAP job not found')

  if (job.triggerStartedAt) {
    await reconcileJob(id)

    return
  }

  if (!password) throw new CustomError('Enter your SAP password', 422)

  if (!(await repository.claimStage(id)))
    throw new CustomError('This job is already being staged; reconcile its status', 409)

  try {
    await staging.stage(job.payload as unknown as StagePayload[])
  } catch {
    await repository.stageFailed(id)

    return
  }

  if (!(await repository.markTrigger(id))) return

  try {
    await gateway.trigger(job.operatorUsername, password)
  } catch {
    await repository.uncertain(id)
  }

  await reconcileJob(id).catch(() => undefined)
}

export default {
  async configuration(user: SessionUser) {
    return {
      customers: internal(user) ? await repository.customers() : [],
      canReview: reviewer(user),
    }
  },
  async references(user: SessionUser, customerId?: string, sto?: string) {
    const customer = await owner(user, customerId)
    const references = await sap.references(customer, sto)
    const slips: { reference: string; incoterm1: string; sapPlant: string }[] = []

    for (let index = 0; index < references.length; index += 5)
      for (const [offset, slip] of (
        await Promise.all(
          references
            .slice(index, index + 5)
            .map((reference) => sap.slip(customer, reference).catch(() => null)),
        )
      ).entries())
        if (slip && (customer.role === 'VENDOR' || ['LCO', 'FRC'].includes(slip.incoterm1)))
          slips.push({
            ...slip,
            reference: references[index + offset]!,
          })

    const downstream = await repository.downstreamPlants([
      ...new Set(slips.map((slip) => slip.sapPlant)),
    ])

    return slips.filter((slip) => downstream.has(slip.sapPlant)).map((slip) => slip.reference)
  },
  async lookup(
    user: SessionUser,
    customerId: string | undefined,
    q: string,
    type: 'drivers' | 'vehicles',
  ) {
    const customer = await owner(user, customerId)

    return type === 'drivers'
      ? sapMaster.searchDrivers(customer, q)
      : sapMaster.searchVehicles(customer, q)
  },
  async document(
    user: SessionUser,
    customerId: string | undefined,
    reference: string,
    sto?: string,
  ) {
    const customer = await owner(user, customerId)
    const snapshot = await sap.document(customer, reference, sto)
    const plant = await repository.plant(snapshot)

    if (!plant)
      throw new CustomError('Map this SAP plant to an active local plant before continuing', 422)

    if (
      (customer.role !== 'VENDOR' && !['LCO', 'FRC'].includes(snapshot.incoterm1)) ||
      plant.companyGroup !== 'DOWNSTREAM'
    )
      throw new CustomError('This document is outside downstream JUL', 422)

    await checkPlant(user, plant.id)
    const cached = await repository.cache(customer.id, plant.id, snapshot)
    const balance = await repository.balance(snapshot)

    return {
      ...snapshot,
      id: cached.id,
      plantId: plant.id,
      plantName: plant.name,
      reservedQuantity: quantityText(balance.reserved),
      heldQuantity: quantityText(balance.held),
      availableQuantity: quantityText(balance.available),
      sapOutstandingQuantity: quantityText(
        quantity(snapshot.contractQuantity) -
          quantity(snapshot.sapUsedQuantity) +
          quantity(snapshot.deletedQuantity),
      ),
      transportModes: await modes(),
    }
  },
  async list(query: JulListQuery, user: SessionUser) {
    const result = await repository.list(query, await scope(user))

    return {
      items: result.rows.map(summary),
      total: result.total,
      page: query.page,
      limit: query.limit,
    }
  },
  async stos(user: SessionUser, customerId: string | undefined, reference: string) {
    return sap.stos(await owner(user, customerId), reference)
  },
  async get(id: string, user: SessionUser) {
    return detail(await stored(id, user), user)
  },
  async save(body: DraftBody, user: SessionUser, id?: string) {
    if (id) {
      const prior = await stored(id, user)

      if (body.customerId && body.customerId !== prior.customerId)
        throw new CustomError('The customer cannot be changed', 422)

      if (body.isMulti !== undefined && body.isMulti !== prior.isMulti)
        throw new CustomError('The registration mode cannot be changed', 422)

      body = {
        ...body,
        customerId: prior.customerId,
        isMulti: prior.isMulti,
      }

      if (!body.version) throw new CustomError('Reload the draft before saving', 409)
    }

    const customer = await owner(user, body.customerId)
    const lines = await prepare(body, user, customer, false)

    const saved = await repository.save(
      customer.id,
      user.id,
      lines,
      id,
      body.version,
      Boolean(body.isMulti),
    )

    return this.get(saved, user)
  },
  async submit(id: string, version: number, user: SessionUser) {
    const row = await stored(id, user)
    const customer = await owner(user, row.customerId)

    const lines = await prepare(
      {
        customerId: row.customerId,
        isMulti: row.isMulti,
        lines: row.lines.map((line) => ({
          id: line.id,
          documentId: line.documentId,
          variant: line.variant as DraftBody['lines'][number]['variant'],
          stoNumber: line.stoNumber ?? undefined,
          driverLicenseNumber: line.driverLicenseNumber ?? undefined,
          vehiclePlateNumber: line.vehiclePlateNumber ?? undefined,
          quantity: line.quantity.toString(),
          loadingDate: line.loadingDate?.toISOString().slice(0, 10),
          mediaTransport: line.mediaTransport as DraftBody['lines'][number]['mediaTransport'],
          remark: line.remark ?? undefined,
        })),
      },
      user,
      customer,
      true,
    )

    await repository.submit(id, version, user.id, lines)

    return this.get(id, user)
  },
  async cancel(id: string, version: number, reason: string, user: SessionUser) {
    await stored(id, user)
    await repository.cancel(id, version, user.id, reason)

    return this.get(id, user)
  },
  choices,
  async approve(id: string, body: ApprovalBody, user: SessionUser) {
    assertReviewer(user)

    if (!body.sapPassword) throw new CustomError('Enter your SAP password', 422)

    const row = await stored(id, user)

    if (row.isMulti) {
      const reviewable = row.lines
        .filter((line) => ['SUBMITTED', 'SAP_RETRY'].includes(line.status))
        .map((line) => line.id)

      if (
        reviewable.length !== body.lines.length ||
        !reviewable.every((lineId) => body.lines.some((input) => input.id === lineId))
      )
        throw new CustomError(
          'Approve all pending delivery orders in a multi-DO trip together',
          422,
        )
    }

    const customer = await owner(user, row.customerId)
    const lines: PreparedLine[] = []
    const payloads: StagePayload[] = []

    for (const input of body.lines) {
      const line = row.lines.find((item) => item.id === input.id)

      if (!line || !['SUBMITTED', 'SAP_RETRY'].includes(line.status))
        throw new CustomError('Select submitted or retryable lines', 409)

      const document = (
        await freshDocument(line.documentId, user, customer, line.stoNumber ?? undefined)
      ).document

      if (!document.paid)
        throw new CustomError(
          'Down payment is no longer sufficient for ' + document.referenceDocument,
          422,
        )

      if (!line.loadingDate || line.loadingDate.toISOString().slice(0, 10) < businessDate())
        throw new CustomError('Loading date is in the past; cancel and create a new request', 422)

      const rule = await choices(line.documentId, user)

      if (
        !rule.factoryStorage.some((item) => item.code === input.factoryStorage) ||
        !rule.otherStorage.some((item) => item.code === input.otherStorage) ||
        !rule.factoryValuation.includes(input.factoryValuation) ||
        !rule.otherValuation.includes(input.otherValuation)
      )
        throw new CustomError('Storage or valuation does not match the configured plant rules', 422)

      const planned = line.quantity.toString().split('.')[0]!
      const loadingNoteType = await repository.loadingNoteType(document.incoterm1)

      if (!loadingNoteType)
        throw new CustomError('Loading-note type is not configured for ' + document.incoterm1, 422)

      lines.push({
        ...line,
        documentSnapshot: document,
        quantity: planned,
      })

      const isSto = Boolean(line.stoNumber)

      payloads.push({
        HEAD_ID: row.id,
        DET_ID: line.id,
        BUKRS: document.company,
        UPLOADID: '1',
        DOTYPE: loadingNoteType,
        ITEMRULE: isSto && document.transportType === 'M' ? '6A' : document.itemRule,
        VBELN_REF: document.referenceDocument,
        EBELN_REF: line.stoNumber,
        POSNR: '000010',
        CREDAT: line.loadingDate.toISOString().slice(0, 10),
        MATNR: document.material,
        PLN_LFIMG: planned,
        DWERKS: document.sapPlant,
        DLGORT: input.factoryStorage,
        RWERKS: document.sapPlant,
        RLGORT: input.otherStorage,
        ZZTRANSP_TYPE: line.mediaTransport,
        WANGKUTAN: '',
        WNOSIM: line.driverLicenseNumber!,
        WNOPOLISI: line.vehiclePlateNumber!,
        L_LFIMG: 0,
        OP_LFIMG: 0,
        DOPLINE: '0000',
        VSLCD: '',
        VOYNR: '',
        DCHARG_1: input.factoryBatch,
        RCHARG_1: input.otherBatch,
        RBWTAR_1: input.otherValuation,
        DBWTAR: input.factoryValuation,
        CREATE_BY: user.id,
        CREATE_AT: new Date().toISOString(),
        ISACTIVE: 'TRUE',
        FLAG: line.status === 'SAP_RETRY' ? 'U' : 'I',
        ISRETRIVEDBYSAP: 'FALSE',
        USERSAP: user.username,
        ...(row.isMulti ? { IS_MULTI: 1 } : {}),
      })
    }

    const job = await repository.approve(id, body.version, user.id, user.username, lines, payloads)

    await runJob(job.id, body.sapPassword)

    return this.get(id, user)
  },
  async reconcile(id: string, user: SessionUser) {
    const row = await stored(id, user)

    for (const jobId of new Set(
      row.lines.map((line) => line.jobId).filter((id): id is string => Boolean(id)),
    ))
      await reconcileJob(jobId)

    return this.get(id, user)
  },
  async resume(id: string, jobId: string, password: string | undefined, user: SessionUser) {
    assertReviewer(user)
    const row = await stored(id, user)
    const job = await repository.job(jobId)

    if (!job || job.registrationId !== row.id || job.operatorUsername !== user.username)
      throw new NotFoundError('Your SAP job was not found')

    await runJob(jobId, password)

    return this.get(id, user)
  },
  async hold(id: string, amount: string, reason: string, user: SessionUser) {
    assertReviewer(user)
    const cached = await repository.document(id)

    if (!cached) throw new NotFoundError('Document not found')

    const customer = await owner(user, cached.customerId)
    const document = (await freshDocument(id, user, customer)).document

    await repository.hold(document, user.id, amount, reason)

    return { updated: true }
  },
  async tick() {
    await repository.recoverStages()
    for (const job of await repository.due()) await reconcileJob(job.id).catch(() => undefined)
    const cutoff = new Date(businessDate())

    cutoff.setUTCDate(cutoff.getUTCDate() - 7)
    await repository.expire(cutoff)
  },
}
