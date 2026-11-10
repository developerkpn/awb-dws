import oracledb from 'oracledb'
import { CustomError } from '@awb/server-core'
import { env } from '../../config/env'
import type { BelStagePayload, StagePayload, StageResult } from '../../types/sap'

let pool: Promise<oracledb.Pool> | undefined

const getPool = () => {
  if (!env.SAP_ORACLE_CONNECT_STRING || !env.SAP_ORACLE_USERNAME || !env.SAP_ORACLE_PASSWORD)
    throw new CustomError('SAP staging credentials are not configured', 503)

  return (pool ??= oracledb
    .createPool({
      user: env.SAP_ORACLE_USERNAME,
      password: env.SAP_ORACLE_PASSWORD,
      connectString: env.SAP_ORACLE_CONNECT_STRING,
      poolMin: 0,
      poolMax: 4,
      queueTimeout: 8000,
    })
    .catch(() => {
      pool = undefined
      throw new CustomError('SAP staging is unavailable', 502)
    }))
}

async function oracle<T>(operation: (connection: oracledb.Connection) => Promise<T>) {
  const connection = await (await getPool()).getConnection()

  connection.callTimeout = env.SAP_REQUEST_TIMEOUT_MS

  try {
    return await operation(connection)
  } catch {
    throw new CustomError(
      'SAP staging operation failed; reconcile its outcome before retrying',
      502,
    )
  } finally {
    await connection.close()
  }
}

function bindExpression(key: string, quantityColumn: string) {
  if (key === 'CREDAT') return "TO_DATE(:CREDAT, 'YYYY-MM-DD')"

  if (key === quantityColumn) {
    return `TO_NUMBER(:${quantityColumn}, '99999999999999D999999', 'NLS_NUMERIC_CHARACTERS=''.,''')`
  }

  if (key === 'CREATE_AT') return 'TO_TIMESTAMP(:CREATE_AT, \'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"\')'

  return ':' + key
}

export default {
  async stage(payloads: StagePayload[]) {
    await oracle(async (connection) => {
      for (const payload of payloads) {
        const columns = Object.keys(payload)
        const value = (key: string) => bindExpression(key, 'PLN_LFIMG')

        await connection.execute(
          payload.FLAG === 'U'
            ? `UPDATE PREREG_LOADING_NOTE_SAP SET ${columns
                .filter((key) => key !== 'DET_ID')
                .map((key) => key + ' = ' + value(key))
                .join(',')} WHERE DET_ID = :DET_ID AND LOADING_NOTE_NUM IS NULL`
            : `INSERT INTO PREREG_LOADING_NOTE_SAP (${columns.join(',')}) SELECT ${columns.map(value).join(',')} FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM PREREG_LOADING_NOTE_SAP WHERE DET_ID = :DET_ID)`,
          { ...payload },
        )
      }

      await connection.commit()
    })
  },

  async stageBel(payloads: BelStagePayload[]): Promise<'oracle' | 'local'> {
    if (!payloads.length) return 'local'

    if (!env.SAP_ORACLE_CONNECT_STRING || !env.SAP_ORACLE_USERNAME || !env.SAP_ORACLE_PASSWORD) {
      if (env.NODE_ENV === 'production') {
        throw new CustomError('SAP BEL staging credentials are not configured', 503)
      }

      return 'local'
    }

    await oracle(async (connection) => {
      for (const payload of payloads) {
        const columns = Object.keys(payload)
        const value = (key: string) => bindExpression(key, 'PLN_MENGE')

        await connection.execute(
          payload.FLAG === 'U'
            ? `UPDATE PREREG_BEL_SAP SET ${columns
                .filter((key) => key !== 'DET_ID')
                .map((key) => key + ' = ' + value(key))
                .join(',')} WHERE DET_ID = :DET_ID`
            : `INSERT INTO PREREG_BEL_SAP (${columns.join(',')}) SELECT ${columns.map(value).join(',')} FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM PREREG_BEL_SAP WHERE DET_ID = :DET_ID)`,
          { ...payload },
        )
      }

      await connection.commit()
    })

    return 'oracle'
  },

  async acknowledge(results: StageResult[]) {
    const reported = results.filter((row) => row.loadingNoteNumber || row.error)

    if (!reported.length) return

    await oracle(async (connection) => {
      for (const result of reported) {
        const terminal =
          !result.loadingNoteNumber && result.error && !/process(?:ed)? by/i.test(result.error)

        await connection.execute(
          `UPDATE PREREG_LOADING_NOTE_SAP SET FLAG_WEB_PULL = 'T'${terminal ? ", ISRETRIVEDBYSAP = 'TRUE'" : ''} WHERE DET_ID = :id`,
          { id: result.id },
        )
      }

      await connection.commit()
    })
  },

  async results(ids: string[]): Promise<StageResult[]> {
    return oracle(async (connection) => {
      const binds = Object.fromEntries(ids.map((id, index) => ['id' + index, id]))

      const result = await connection.execute<{
        DET_ID: string
        LOADING_NOTE_NUM: string | null
        ERRORDESCRIPTION: string | null
      }>(
        `SELECT DET_ID, LOADING_NOTE_NUM, ERRORDESCRIPTION FROM PREREG_LOADING_NOTE_SAP WHERE DET_ID IN (${ids.map((_, index) => ':id' + index).join(',')})`,
        binds,
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          maxRows: ids.length,
        },
      )

      return (result.rows ?? []).map((row) => ({
        id: row.DET_ID,
        loadingNoteNumber: row.LOADING_NOTE_NUM?.trim() || null,
        error: row.ERRORDESCRIPTION?.slice(0, 500) || null,
      }))
    })
  },
}
