import { CustomError } from '@awb/server-core'
import { env } from '../../config/env'
import { odataCollection } from './sap.schema'
import type { SapEntity, SapMasterEntity, SapOwner, SapPaging, SapRow } from '../../types/sap'

export const odataLiteral = (value: string) => "'" + value.replace(/'/g, "''") + "'"

export function sapUrl(
  entity: SapEntity | 'DOTRXSet' | 'VEND_PO_QTYSet',
  filter?: string,
  paging?: SapPaging,
  service = 'ZGW_REGISTRA_SRV',
) {
  const url = new URL('/sap/opu/odata/sap/' + service + '/' + entity, env.SAP_ODATA_BASE_URL)

  url.searchParams.set('$format', 'json')

  if (filter) url.searchParams.set('$filter', filter)

  if (paging) {
    url.searchParams.set('$top', String(paging.top))
    url.searchParams.set('$skip', String(paging.skip))
  }

  return url
}

async function collection(url: URL, allowNext = false): Promise<SapRow[]> {
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
    throw new CustomError('SAP lookup is unavailable', 502)
  })

  if (!response.ok) throw new CustomError('SAP lookup failed (HTTP ' + response.status + ')', 502)

  const parsed = odataCollection.safeParse(await response.json())

  if (!parsed.success || (parsed.data.d.__next && !allowNext))
    throw new CustomError('SAP returned an unsupported or incomplete collection', 502)

  return parsed.data.d.results
}

export default {
  read(
    entity: SapEntity,
    filter: string,
    _owner?: SapOwner,
    _values: Record<string, string> = {},
  ): Promise<SapRow[]> {
    return collection(sapUrl(entity, filter))
  },

  page(entity: SapMasterEntity, paging: SapPaging): Promise<SapRow[]> {
    return collection(sapUrl(entity, undefined, paging), true)
  },

  vendorPurchaseOrders(vendorCode: string): Promise<SapRow[]> {
    return collection(
      sapUrl(
        'VEND_PO_QTYSet',
        '(Lifnr eq ' + odataLiteral(vendorCode) + ')',
        undefined,
        'ZGW_WMS_SRV',
      ),
    )
  },

  async trigger(operator: string, password?: string) {
    if (!password) throw new CustomError('Enter your SAP password to create loading notes', 422)

    const response = await fetch(sapUrl('DOTRXSet'), {
      headers: {
        Authorization: 'Basic ' + Buffer.from(operator + ':' + password).toString('base64'),
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(env.SAP_REQUEST_TIMEOUT_MS),
      redirect: 'error',
    })

    if (!response.ok)
      throw new CustomError('SAP processing outcome is uncertain; reconcile before retrying', 502)
  },
}
