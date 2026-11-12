// One-shot copy of the plant's WB.NET masters into the plant DB, written as SAP rows (WB.NET data is SAP data).
// Usage: WBNET_DATABASE_URL=... WBNET_COMPANY=EU WBNET_LOCATION=K1 npm run masters:backfill -w @awb/site-api [-- --only=contract,vehicle]
import sql from 'mssql'
import { z } from 'zod'
import { masterKinds, type MasterKind } from '@awb/contracts'
import { parseSqlServerUrl } from '../src/lib/sqlserver-url'
import {
  wbCommodity,
  wbContract,
  wbDestination,
  wbDriver,
  wbEstate,
  wbQualityItem,
  wbRelation,
  wbTanker,
  wbTransactionType,
  wbTransporter,
  wbTruck,
} from '../src/modules/master/master.mappers'
import masterService from '../src/modules/master/master.service'
import type { SapRow } from '../src/types/master'

const settings = z
  .object({
    WBNET_DATABASE_URL: z.string().startsWith('sqlserver://'),
    WBNET_COMPANY: z.string().trim().min(1),
    WBNET_LOCATION: z.string().trim().min(1),
  })
  .parse(process.env)

const only = process.argv
  .find((arg) => arg.startsWith('--only='))
  ?.slice('--only='.length)
  .split(',')
  .filter(Boolean)

const wanted = (kind: MasterKind) => !only || only.includes(kind)

// Every query is filtered to one company + location and skips soft-deleted rows. wb_location is never read.
const notDeleted = (alias = '') => `ISNULL(${alias}Deleted, 'N') <> 'Y'`
const scope = (alias = '') => `${alias}Coy = @coy AND ${alias}Location_Code = @loc`

const QUERIES = {
  transactionType: `SELECT Transaction_Code, Transaction_Name, IO, is_return, is_vessel, trx_require_internal_no, trx_require_tanker
    FROM wb_transaction_type WHERE ${scope()} AND ${notDeleted()}`,
  commodity: `SELECT Comm_Code, Comm_Name, Unit, Tolerance, Material, SAP_Code FROM wb_commodity WHERE ${scope()} AND ${notDeleted()}`,
  relation: `SELECT Relation_Code, Relation_Name, Relation_Type, City, Black_List FROM wb_relation WHERE ${scope()} AND ${notDeleted()}`,
  estate: `SELECT Estate_Code, Estate_Name, City, SAP_Code FROM wb_estate WHERE ${scope()} AND ${notDeleted()}`,
  transporter: `SELECT Transporter_Code, Transporter_Name, Address, Phone, SAP_Code, Black_List FROM wb_transporter WHERE ${scope()} AND ${notDeleted()}`,
  qualityItem: `SELECT Yield_Code, Yield_Name, SAP_Code FROM wb_yield WHERE ${scope()} AND ${notDeleted()}`,
  destination: `SELECT Source_Code, Description, Storage_Loc FROM wb_source WHERE ${scope()} AND ${notDeleted()}`,
  destinationMapping: `SELECT source_code AS Source_Code FROM wb_source_mapping WHERE coy = @coy AND location_code = @loc`,
  tanker: `SELECT Tanker_No, Truck_Number, Capacity, Check_Tanker, CheckTankerTol, CheckTankerKG FROM wb_tanker WHERE ${scope()} AND ${notDeleted()}`,
  vehicle: `SELECT t.Truck_Number, t.Transporter_Code, tr.Transporter_Name, t.Tanker_No, t.Min_Tare, t.Max_Tare, t.Black_List
    FROM wb_truck t
    LEFT JOIN wb_transporter tr ON tr.Coy = t.Coy AND tr.Location_Code = t.Location_Code
      AND tr.Transporter_Code = t.Transporter_Code AND ${notDeleted('tr.')}
    WHERE ${scope('t.')} AND ${notDeleted('t.')}`,
  driver: `SELECT License_No, Name, Address, Phone, Birth_Place, Birth_Date, Truck_Number, Black_List
    FROM wb_driver WHERE ${scope()} AND ${notDeleted()}`,
  contract: `SELECT Do_No, Do_Date, Contract, Transaction_Code, Comm_Code, Relation_Code, Transporter_Code, Estate1_Code, PI_No,
      Quantity, Tolerance, Franco, SO, SO_Item, STO, closed, closed_date
    FROM wb_contract WHERE ${scope()} AND ${notDeleted()}`,
  contractDetail: `SELECT Do_No, SAP_Code, SAP_Value FROM wb_contract_detail WHERE ${scope()}`,
}

const mapAll = <T>(rows: SapRow[], map: (row: SapRow) => T | null) =>
  rows.flatMap((row) => map(row) ?? [])

async function main() {
  const pool = await new sql.ConnectionPool({
    ...parseSqlServerUrl(settings.WBNET_DATABASE_URL),
    requestTimeout: 300_000,
    options: {
      ...parseSqlServerUrl(settings.WBNET_DATABASE_URL).options,
      readOnlyIntent: true,
      appName: 'awb-dws-masters-backfill',
    },
  } as sql.config).connect()

  const read = async (query: string) =>
    (
      await pool
        .request()
        .input('coy', sql.VarChar(20), settings.WBNET_COMPANY)
        .input('loc', sql.VarChar(20), settings.WBNET_LOCATION)
        .query<SapRow>(query)
    ).recordset

  const at = new Date()
  const counts: Partial<Record<MasterKind, number>> = {}

  try {
    for (const kind of masterKinds) {
      if (!wanted(kind)) continue

      const started = Date.now()

      switch (kind) {
        case 'transactionType':
          counts[kind] = await masterService.backfill(
            kind,
            mapAll(await read(QUERIES.transactionType), wbTransactionType),
            at,
          )

          break
        case 'commodity':
          counts[kind] = await masterService.backfill(
            kind,
            mapAll(await read(QUERIES.commodity), wbCommodity),
            at,
          )

          break
        case 'relation':
          counts[kind] = await masterService.backfill(
            kind,
            mapAll(await read(QUERIES.relation), wbRelation),
            at,
          )

          break
        case 'estate':
          counts[kind] = await masterService.backfill(
            kind,
            mapAll(await read(QUERIES.estate), wbEstate),
            at,
          )

          break
        case 'transporter':
          counts[kind] = await masterService.backfill(
            kind,
            mapAll(await read(QUERIES.transporter), wbTransporter),
            at,
          )

          break
        case 'qualityItem':
          counts[kind] = await masterService.backfill(
            kind,
            mapAll(await read(QUERIES.qualityItem), wbQualityItem),
            at,
          )

          break

        case 'destination': {
          const named = mapAll(await read(QUERIES.destination), wbDestination)
          const known = new Set(named.map((row) => row.code))

          const mapped = mapAll(await read(QUERIES.destinationMapping), wbDestination).filter(
            (row) => !known.has(row.code),
          )

          counts[kind] = await masterService.backfill(kind, [...named, ...mapped], at)
          break
        }

        case 'tanker':
          counts[kind] = await masterService.backfill(
            kind,
            mapAll(await read(QUERIES.tanker), wbTanker),
            at,
          )

          break
        case 'vehicle':
          counts[kind] = await masterService.backfill(
            kind,
            mapAll(await read(QUERIES.vehicle), wbTruck),
            at,
          )

          break
        case 'driver':
          counts[kind] = await masterService.backfill(
            kind,
            mapAll(await read(QUERIES.driver), wbDriver),
            at,
          )

          break

        case 'contract': {
          const specs = new Map<string, SapRow[]>()

          for (const row of await read(QUERIES.contractDetail)) {
            const key = String(row.Do_No ?? '')
              .trim()
              .toUpperCase()

            specs.set(key, [...(specs.get(key) ?? []), row])
          }

          const rows = mapAll(await read(QUERIES.contract), (row) =>
            wbContract(
              row,
              specs.get(
                String(row.Do_No ?? '')
                  .trim()
                  .toUpperCase(),
              ),
            ),
          )

          counts[kind] = await masterService.backfill(kind, rows, at)
          break
        }
      }

      console.log(
        `${kind.padEnd(16)} ${String(counts[kind]).padStart(6)} rows  (${Date.now() - started} ms)`,
      )
    }
  } finally {
    await pool.close()
  }

  console.log(
    `Backfilled ${settings.WBNET_COMPANY}/${settings.WBNET_LOCATION} as SAP rows at ${at.toISOString()}.`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Backfill failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
