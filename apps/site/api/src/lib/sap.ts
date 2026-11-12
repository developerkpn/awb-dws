import { CustomError } from '@awb/server-core'
import { env } from '../config/env'
import type { SapPaging, SapRow } from '../types/master'

export const odataLiteral = (value: string) => "'" + value.replace(/'/g, "''") + "'"

export function sapUrl(entity: string, filter?: string, paging?: SapPaging) {
  const url = new URL('/sap/opu/odata/sap/ZGW_REGISTRA_SRV/' + entity, env.SAP_ODATA_BASE_URL)

  url.searchParams.set('$format', 'json')

  if (filter) url.searchParams.set('$filter', filter)

  if (paging) {
    url.searchParams.set('$top', String(paging.top))
    url.searchParams.set('$skip', String(paging.skip))
  }

  return url
}

function isRowList(value: unknown): value is SapRow[] {
  return Array.isArray(value) && value.every((row) => typeof row === 'object' && row !== null)
}

/** One OData collection read with the service account. */
export async function sapCollection(url: URL): Promise<SapRow[]> {
  if (!env.SAP_SERVICE_USERNAME || !env.SAP_SERVICE_PASSWORD)
    throw new CustomError('SAP service credentials are not configured', 503)

  const response = await fetch(url, {
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(env.SAP_SERVICE_USERNAME + ':' + env.SAP_SERVICE_PASSWORD).toString('base64'),
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(env.SAP_REQUEST_TIMEOUT_MS),
    redirect: 'error',
  }).catch(() => {
    throw new CustomError('SAP is unavailable', 502)
  })

  if (!response.ok) throw new CustomError('SAP request failed (HTTP ' + response.status + ')', 502)

  const body: unknown = await response.json().catch(() => null)

  const results =
    typeof body === 'object' && body !== null && 'd' in body
      ? (body.d as { results?: unknown }).results
      : undefined

  if (!isRowList(results)) throw new CustomError('SAP returned an unsupported collection', 502)

  return results
}

/** Pages through a set; stops on an empty page or one without new keys (some sets ignore $skip). */
export async function sapCollectAll(
  entity: string,
  key: (row: SapRow) => string,
  options: { filter?: string; pageSize?: number; maxPages?: number } = {},
) {
  const rows = new Map<string, SapRow>()
  const pageSize = options.pageSize ?? 1000
  let skip = 0

  for (let page = 0; page < (options.maxPages ?? 200); page++) {
    const batch = await sapCollection(
      sapUrl(entity, options.filter, {
        top: pageSize,
        skip,
      }),
    )

    const before = rows.size

    for (const row of batch) {
      const id = key(row)

      if (id) rows.set(id, row)
    }

    if (!batch.length || rows.size === before) break

    skip += batch.length
  }

  return [...rows.values()]
}
