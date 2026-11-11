import type { SessionUser } from '@awb/contracts'
import { CustomError } from '@awb/server-core'
import { licenseKey, plateKey } from '../../lib/master-data'
import staging from '../sap/sap-stage.repository'
import sapMaster from '../sap-master/sap-master.service'
import poRepository from './bel-po.repository'
import repository, { mapBelDetail } from './bel.repository'
import type { BelStagePayload } from '../../types/sap'
import type {
  ApprovalBody,
  BelListQuery,
  BelScope,
  DraftBody,
  PreparedBelLine,
  ReasonBody,
} from '../../types/bel'

const BEL_ROLES = ['VENDOR', 'ADMIN', 'LOGISTIC', 'COMMERCIAL']

function assertBelUser(user: SessionUser) {
  if (!BEL_ROLES.includes(user.role)) {
    throw new CustomError(
      'BEL pre-registration is only available for vendors and internal operators',
      403,
    )
  }
}

function assertReviewer(user: SessionUser) {
  const allowed =
    user.role === 'ADMIN' ||
    (user.role === 'LOGISTIC' && user.permissions.includes('prereg:approve'))

  if (!allowed) {
    throw new CustomError('Logistics approval permission is required', 403)
  }
}

async function scopeFor(user: SessionUser): Promise<BelScope> {
  if (user.role === 'VENDOR') {
    return {
      vendorId: user.id,
    }
  }

  if (user.role === 'LOGISTIC') {
    return {
      plantIds: await repository.userPlantIds(user.id),
    }
  }

  return {}
}

async function resolveVendor(user: SessionUser, requestedVendorId?: string) {
  const targetId = user.role === 'VENDOR' ? user.id : requestedVendorId

  if (user.role === 'VENDOR' && requestedVendorId && requestedVendorId !== user.id) {
    throw new CustomError('Vendors can only access their own registrations', 403)
  }

  if (!targetId) {
    throw new CustomError('Select a vendor account', 422)
  }

  const vendor = await repository.findVendor(targetId)

  if (!vendor || !vendor.isActive || vendor.role.code !== 'VENDOR') {
    throw new CustomError('Selected vendor account is not active', 422)
  }

  return vendor
}

function toLoadingDate(value?: string | null) {
  return value ? new Date(value + 'T00:00:00.000Z') : null
}

async function prepareLines(
  user: SessionUser,
  vendorId: string,
  owner: { id: string; username: string; role: string },
  lines: DraftBody['lines'],
  requireMaster: boolean,
): Promise<PreparedBelLine[]> {
  const logisticPlantIds = user.role === 'LOGISTIC' ? await repository.userPlantIds(user.id) : null
  const prepared: PreparedBelLine[] = []

  for (const line of lines) {
    const doc = await repository.documentForVendor(vendorId, line.documentId)

    if (!doc) {
      throw new CustomError('PO item does not belong to this vendor', 422)
    }

    if (logisticPlantIds && !logisticPlantIds.includes(doc.plantId)) {
      throw new CustomError('You are not assigned to plant ' + doc.plant.name, 403)
    }

    const snapshot = repository.parseSnapshot(doc.snapshot)

    if (snapshot.completed) {
      throw new CustomError(
        `PO ${snapshot.poNumber}/${snapshot.poItem} is marked completed in SAP`,
        422,
      )
    }

    const rawLicense = line.driverLicenseNumber?.trim()
    const rawPlate = line.vehiclePlateNumber?.trim()

    if (requireMaster && (!rawLicense || !rawPlate)) {
      throw new CustomError('Select both a registered driver and vehicle before submitting', 422)
    }

    let driverLicenseNumber: string | null = null
    let driverName: string | null = null

    if (rawLicense) {
      const normalizedLicense = licenseKey(rawLicense)
      const driver = await sapMaster.driver(owner, normalizedLicense)

      if (!driver) {
        throw new CustomError('Driver ' + normalizedLicense + ' was not found in SAP master', 422)
      }

      driverLicenseNumber = driver.licenseNumber
      driverName = driver.name
    }

    let vehiclePlateNumber: string | null = null

    if (rawPlate) {
      const normalizedPlate = plateKey(rawPlate)
      const vehicle = await sapMaster.vehicle(owner, normalizedPlate)

      if (!vehicle) {
        throw new CustomError('Vehicle ' + normalizedPlate + ' was not found in SAP master', 422)
      }

      vehiclePlateNumber = vehicle
    }

    prepared.push({
      id: line.id,
      documentId: doc.id,
      documentSnapshot: snapshot,
      driverLicenseNumber,
      driverName,
      vehiclePlateNumber,
      quantity: line.quantity,
      loadingDate: toLoadingDate(line.loadingDate),
      mediaTransport: line.mediaTransport,
      remark: line.remark?.trim() || null,
    })
  }

  return prepared
}

export default {
  async vendors(user: SessionUser) {
    assertBelUser(user)

    if (user.role === 'VENDOR') {
      return [
        {
          id: user.id,
          name: user.name,
          username: user.username,
        },
      ]
    }

    return repository.listVendors()
  },

  async poItems(user: SessionUser, vendorId?: string) {
    assertBelUser(user)

    const vendor = await resolveVendor(user, vendorId)
    const items = await poRepository.listByVendor(vendor.username)
    const codes = [...new Set(items.map((item) => item.sapPlant).filter(Boolean))]
    const plants = await repository.plantsByCodes(codes)
    const plantByCode = new Map(plants.map((plant) => [plant.sapPlantCode, plant]))

    const logisticPlantIds =
      user.role === 'LOGISTIC' ? await repository.userPlantIds(user.id) : null

    const mapped = items
      .map((item) => {
        const plant = plantByCode.get(item.sapPlant)

        if (!plant) return null

        if (logisticPlantIds && !logisticPlantIds.includes(plant.id)) return null

        return {
          item,
          plantId: plant.id,
          plantName: plant.name,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

    if (!mapped.length) return []

    return repository.cachePoItems(vendor.id, mapped)
  },

  async drivers(user: SessionUser, q = '', vendorId?: string) {
    assertBelUser(user)

    if (user.role === 'VENDOR' || vendorId) {
      const vendor = await resolveVendor(user, vendorId)

      return sapMaster.searchDrivers(
        {
          id: vendor.id,
          username: vendor.username,
          role: vendor.role.code,
        },
        q,
      )
    }

    return sapMaster.searchDrivers(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      q,
    )
  },

  async vehicles(user: SessionUser, q = '', vendorId?: string) {
    assertBelUser(user)

    if (user.role === 'VENDOR' || vendorId) {
      const vendor = await resolveVendor(user, vendorId)

      return sapMaster.searchVehicles(
        {
          id: vendor.id,
          username: vendor.username,
          role: vendor.role.code,
        },
        q,
      )
    }

    return sapMaster.searchVehicles(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      q,
    )
  },

  async list(query: BelListQuery, user: SessionUser) {
    assertBelUser(user)

    return repository.list(query, await scopeFor(user))
  },

  async getById(id: string, user: SessionUser) {
    assertBelUser(user)

    const row = await repository.find(id, await scopeFor(user))

    if (!row) {
      throw new CustomError('BEL request was not found', 404)
    }

    return mapBelDetail(row)
  },

  async create(body: DraftBody, user: SessionUser) {
    assertBelUser(user)

    const vendor = await resolveVendor(user, body.vendorId)

    const owner = {
      id: vendor.id,
      username: vendor.username,
      role: vendor.role.code,
    }

    const prepared = await prepareLines(user, vendor.id, owner, body.lines, false)

    const saved = await repository.saveDraft({
      vendorId: vendor.id,
      actorId: user.id,
      scope: await scopeFor(user),
      prepared,
    })

    return mapBelDetail(saved)
  },

  async update(id: string, body: DraftBody, user: SessionUser) {
    assertBelUser(user)

    const scope = await scopeFor(user)
    const existing = await repository.find(id, scope)

    if (!existing) {
      throw new CustomError('BEL request was not found', 404)
    }

    const vendor = await resolveVendor(user, existing.vendorId)

    const owner = {
      id: vendor.id,
      username: vendor.username,
      role: vendor.role.code,
    }

    const prepared = await prepareLines(user, vendor.id, owner, body.lines, false)

    const saved = await repository.saveDraft({
      id: existing.id,
      vendorId: vendor.id,
      actorId: user.id,
      scope,
      version: body.version,
      prepared,
    })

    return mapBelDetail(saved)
  },

  async submit(id: string, user: SessionUser, version?: number) {
    assertBelUser(user)

    const scope = await scopeFor(user)
    const existing = await repository.find(id, scope)

    if (!existing) {
      throw new CustomError('BEL request was not found', 404)
    }

    const vendor = await resolveVendor(user, existing.vendorId)

    const owner = {
      id: vendor.id,
      username: vendor.username,
      role: vendor.role.code,
    }

    const linesToValidate: DraftBody['lines'] = existing.lines.map((line) => ({
      id: line.id,
      documentId: line.documentId,
      driverLicenseNumber: line.driverLicenseNumber ?? undefined,
      vehiclePlateNumber: line.vehiclePlateNumber ?? undefined,
      quantity: String(line.quantity),
      loadingDate: line.loadingDate ? line.loadingDate.toISOString().slice(0, 10) : undefined,
      mediaTransport: line.mediaTransport as DraftBody['lines'][number]['mediaTransport'],
      remark: line.remark ?? undefined,
    }))

    const prepared = await prepareLines(user, vendor.id, owner, linesToValidate, true)

    const submitted = await repository.submit({
      id: existing.id,
      actorId: user.id,
      scope,
      version,
      prepared,
    })

    return mapBelDetail(submitted)
  },

  async approve(id: string, user: SessionUser, body: ApprovalBody) {
    assertReviewer(user)

    const approved = await repository.approve({
      id,
      actorId: user.id,
      actorUsername: user.username,
      scope: await scopeFor(user),
      version: body.version,
      stage: (payloads: BelStagePayload[]) => staging.stageBel(payloads),
    })

    return mapBelDetail(approved)
  },

  async reject(id: string, user: SessionUser, body: ReasonBody) {
    assertReviewer(user)

    const rejected = await repository.reject({
      id,
      actorId: user.id,
      actorUsername: user.username,
      scope: await scopeFor(user),
      reason: body.reason,
      version: body.version,
      stage: (payloads: BelStagePayload[]) => staging.stageBel(payloads),
    })

    return mapBelDetail(rejected)
  },

  async cancel(id: string, user: SessionUser, body: ReasonBody) {
    assertBelUser(user)

    const cancelled = await repository.cancel({
      id,
      actorId: user.id,
      actorUsername: user.username,
      scope: await scopeFor(user),
      reason: body.reason,
      version: body.version,
      stage: (payloads: BelStagePayload[]) => staging.stageBel(payloads),
    })

    return mapBelDetail(cancelled)
  },
}
