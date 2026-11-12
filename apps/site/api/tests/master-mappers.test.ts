import { describe, expect, it } from 'vitest'
import { parseSqlServerUrl } from '../src/lib/sqlserver-url'
import {
  code,
  sapRelation,
  sapVehicle,
  wbContract,
  wbDestination,
  wbDriver,
  wbQualityItem,
  wbTransactionType,
  wbTruck,
} from '../src/modules/master/master.mappers'

describe('master mappers', () => {
  it('normalises SAP rows', () => {
    expect(sapVehicle({ Nnopolisi: '  kb  8195   uw ' })).toEqual({ plateNumber: 'KB 8195 UW' })
    expect(sapVehicle({ Nnopolisi: '  ' })).toBeNull()

    expect(
      sapRelation(
        {
          Lifnr: 'at21000006',
          Name1: 'JATIMJAYA',
        },
        'S',
      ),
    ).toEqual({
      code: 'AT21000006',
      name: 'JATIMJAYA',
      type: 'S',
      city: undefined,
    })
  })

  it('maps WB.NET trucks, drivers and transaction types', () => {
    expect(
      wbTruck({
        Truck_Number: 'kb 2345 qz',
        Transporter_Code: 'jnp03',
        Transporter_Name: 'JNP',
        Tanker_No: 'BST 01',
        Min_Tare: '0',
        Max_Tare: '12000.5',
        Black_List: 'N',
      }),
    ).toEqual({
      plateNumber: 'KB 2345 QZ',
      transporterCode: 'JNP03',
      transporterName: 'JNP',
      tankerNumber: 'BST 01',
      tareMinKg: '0',
      tareMaxKg: '12000.5',
      isBlacklisted: false,
    })

    expect(
      wbDriver({
        License_No: ' 000815290110 ',
        Name: null,
        Black_List: 'Y',
        Birth_Date: new Date('1990-01-01T00:00:00Z'),
      }),
    ).toMatchObject({
      licenseNumber: '000815290110',
      name: '000815290110',
      isBlacklisted: true,
      birthDate: new Date('1990-01-01T00:00:00Z'),
    })

    expect(
      wbTransactionType({
        Transaction_Code: 'JUL',
        Transaction_Name: 'PENJUALAN',
        IO: 'O',
        is_return: 'N',
        is_vessel: null,
        trx_require_internal_no: 'Y',
        trx_require_tanker: null,
      }),
    ).toEqual({
      code: 'JUL',
      name: 'PENJUALAN',
      direction: 'O',
      isReturn: false,
      isVessel: false,
      requiresLoadingNote: true,
      requiresTanker: false,
    })
  })

  it('maps WB.NET DOs with their specs, destinations and QC items', () => {
    expect(
      wbContract(
        {
          Do_No: ' sk01ii02-00600 ',
          Transaction_Code: 'bel',
          Comm_Code: '8010-10.11102',
          Relation_Code: 'at11002698',
          Estate1_Code: 'euk',
          Quantity: 250000,
          Tolerance: 2,
          closed: 'X',
          closed_date: null,
        },
        [
          {
            SAP_Code: 'FFA',
            SAP_Value: '5.000',
          },
          {
            SAP_Code: ' ',
            SAP_Value: '1',
          },
        ],
      ),
    ).toMatchObject({
      doNumber: 'SK01II02-00600',
      transactionCode: 'BEL',
      commodityCode: '8010-10.11102',
      relationCode: 'AT11002698',
      estateCode: 'EUK',
      quantityKg: '250000',
      tolerancePercent: '2',
      isClosed: true,
      qualities: [
        {
          sapCode: 'FFA',
          value: '5.000',
        },
      ],
    })

    expect(wbDestination({ Source_Code: 'ref' })).toEqual({
      code: 'REF',
      name: undefined,
      storageLocation: undefined,
    })

    expect(
      wbQualityItem({
        Yield_Code: 'M&I',
        Yield_Name: 'MOISTURE & IMPURITIES',
        SAP_Code: 'mni',
      }),
    ).toEqual({
      code: 'M&I',
      name: 'MOISTURE & IMPURITIES',
      sapCode: 'MNI',
    })
  })

  it('treats the WB.NET placeholder "_" as no code', () => {
    expect(code('_')).toBeNull()
    expect(code(' - ')).toBeNull()
    expect(code('bms')).toBe('BMS')
  })

  it('reads a sqlserver:// URL', () => {
    expect(
      parseSqlServerUrl(
        'sqlserver://172.30.1.98:1433;database=WBSYSTEM;user=reader;password=p@ss;encrypt=true;trustServerCertificate=true',
      ),
    ).toEqual({
      server: '172.30.1.98',
      port: 1433,
      database: 'WBSYSTEM',
      user: 'reader',
      password: 'p@ss',
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    })
  })
})
