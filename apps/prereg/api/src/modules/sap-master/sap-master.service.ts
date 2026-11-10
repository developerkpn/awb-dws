import { CustomError } from '@awb/server-core'
import type { SapMasterImport, SapMasterSummary, SessionUser } from '@awb/contracts'
import { licenseKey, plateKey } from '../../lib/master-data'
import sap from '../sap/sap.service'
import repository from './sap-master.repository'
import type { SapOwner, SapPaging } from '../../types/sap'

const PAGE_SIZE = 1000
const MAX_PAGES = 1000
const LICENSE = /^\d{6,25}$/
const PLATE = /^(?=.*\d)[A-Z0-9 ]{4,20}$/

async function collect<T>(load: (paging: SapPaging) => Promise<T[]>, key: (row: T) => string) {
  const rows = new Map<string, T>()
  let skip = 0

  // Stops on an empty page or one without new rows, so a service that ignores $skip ends after one repeat.
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await load({
      top: PAGE_SIZE,
      skip,
    })

    const before = rows.size

    for (const row of batch) if (key(row)) rows.set(key(row), row)

    if (!batch.length || rows.size === before) break

    skip += batch.length
  }

  return [...rows.values()]
}

async function run(id: string) {
  try {
    const drivers = await collect(
      (paging) => sap.driversPage(paging),
      (row) => row.licenseNumber,
    )

    await repository.saveDrivers(drivers)

    await repository.progress(id, {
      driverCount: drivers.length,
      vehicleCount: 0,
    })

    const vehicles = await collect(
      (paging) => sap.vehiclesPage(paging),
      (row) => row.plateNumber,
    )

    await repository.saveVehicles(vehicles)

    await repository.progress(id, {
      driverCount: drivers.length,
      vehicleCount: vehicles.length,
    })

    await repository.finishImport(id)
  } catch (error) {
    await repository
      .finishImport(id, error instanceof Error ? error.message : 'SAP download failed')
      .catch(() => console.error('SAP master import status could not be saved'))
  }
}

function importView(row: NonNullable<Awaited<ReturnType<typeof repository.startImport>>>) {
  return {
    id: row.id,
    status: row.status,
    driverCount: row.driverCount,
    vehicleCount: row.vehicleCount,
    error: row.error,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  } as SapMasterImport
}

async function sapDriver(owner: SapOwner, licenseNumber: string) {
  const row = await sap.driver(owner, licenseNumber)

  if (!row) return null

  await repository.saveDrivers([row])

  return {
    licenseNumber: row.licenseNumber,
    name: row.name,
  }
}

async function sapVehicle(owner: SapOwner, plateNumber: string) {
  const row = await sap.vehicle(owner, plateNumber)

  if (!row) return null

  await repository.saveVehicles([row])

  return row.plateNumber
}

export default {
  async summary(): Promise<SapMasterSummary> {
    const result = await repository.summary()

    return {
      drivers: result.drivers,
      vehicles: result.vehicles,
      latestImport: result.latestImport ? importView(result.latestImport) : null,
    }
  },

  async startImport(user: SessionUser) {
    const row = await repository.startImport(user.id)

    if (!row) throw new CustomError('A SAP download is already running', 409)

    void run(row.id)

    return importView(row)
  },

  async searchDrivers(owner: SapOwner, q: string) {
    const query = licenseKey(q)
    const local = await repository.searchDrivers(query)

    if (!LICENSE.test(query) || local.some((row) => row.licenseNumber.toUpperCase() === query))
      return local

    if ((await repository.findDriver(query))?.isActive === false) return local

    const found = await sapDriver(owner, query).catch((error) => {
      if (local.length) return null

      throw error
    })

    return found ? [found, ...local] : local
  },

  async searchVehicles(owner: SapOwner, q: string) {
    const query = plateKey(q)
    const local = await repository.searchVehicles(query)

    if (!PLATE.test(query) || local.some((plate) => plate.toUpperCase() === query)) return local

    if ((await repository.findVehicle(query))?.isActive === false) return local

    const found = await sapVehicle(owner, query).catch((error) => {
      if (local.length) return null

      throw error
    })

    return found ? [found, ...local] : local
  },

  async driver(owner: SapOwner, licenseNumber: string) {
    const query = licenseKey(licenseNumber)
    const local = await repository.findDriver(query)

    if (local && (!local.isActive || local.inSap))
      return local.isActive
        ? {
            licenseNumber: local.licenseNumber,
            name: local.name,
          }
        : null

    return sapDriver(owner, query)
  },

  async vehicle(owner: SapOwner, plateNumber: string) {
    const query = plateKey(plateNumber)
    const local = await repository.findVehicle(query)

    if (local && (!local.isActive || local.inSap)) return local.isActive ? local.plateNumber : null

    return sapVehicle(owner, query)
  },
}
