import type { sapEntities } from '../modules/sap/sap.schema'

export type SapEntity = (typeof sapEntities)[number]

export type SapRow = Record<string, unknown>

export type SapMasterEntity = 'SIMSet' | 'TRUCKSet'

export interface SapPaging {
  top: number
  skip: number
}

export interface SapOwner {
  id: string
  username: string
  role: string
}

export interface StageResult {
  id: string
  loadingNoteNumber: string | null
  error: string | null
}

export interface StagePayload {
  HEAD_ID: string
  DET_ID: string
  BUKRS: string
  UPLOADID: string
  DOTYPE: string
  ITEMRULE: string
  VBELN_REF: string
  EBELN_REF: string | null
  POSNR: string
  CREDAT: string
  MATNR: string
  PLN_LFIMG: string
  DWERKS: string
  DLGORT: string
  RWERKS: string
  RLGORT: string
  ZZTRANSP_TYPE: string
  WANGKUTAN: string
  WNOSIM: string
  WNOPOLISI: string
  L_LFIMG: number
  OP_LFIMG: number
  DOPLINE: string
  VSLCD: string
  VOYNR: string
  DCHARG_1: string
  RCHARG_1: string
  RBWTAR_1: string
  DBWTAR: string
  CREATE_BY: string
  CREATE_AT: string
  ISACTIVE: string
  FLAG: string
  ISRETRIVEDBYSAP: string
  USERSAP: string
  IS_MULTI?: number
}

export interface BelStagePayload {
  DET_ID: string
  HEAD_ID: string
  REG_NUMBER: string
  LIFNR: string
  EBELN: string
  EBELP: string
  MATNR: string
  WERKS: string
  PLN_MENGE: string
  MEINS: string
  CREDAT: string | null
  ZZTRANSP_TYPE: string
  WNOSIM: string
  WNONAMA: string | null
  WNOPOLISI: string
  REMARK: string | null
  CREATE_BY: string
  CREATE_AT: string
  USERSAP: string
  PREREG_STATUS: 'APPROVED' | 'CANCELLED'
  FLAG: 'I' | 'U'
  ISACTIVE: 'TRUE' | 'FALSE'
  PREREG_FLAG: 'I' | 'U'
  ISRETREIVEDBYSAP: 'FALSE' | 'TRUE'
}
