import type {
  CommodityInput,
  ContractInput,
  DestinationInput,
  DriverInput,
  EstateInput,
  QualityItemInput,
  RelationInput,
  SapRow,
  TankerInput,
  TransactionTypeInput,
  TransporterInput,
  VehicleInput,
} from '../../types/master'

/** WB.NET and SAP rows are loose: trim everything and treat blanks as missing. */
export const text = (value: unknown) => {
  if (value === null || value === undefined) return null

  const trimmed = String(value).trim()

  return trimmed || null
}

/** Codes are compared in upper case; WB.NET writes "_" or "-" when there is no code. */
export const code = (value: unknown) => {
  const upper = text(value)?.toUpperCase() ?? null

  return upper && /^[-_.]+$/.test(upper) ? null : upper
}

export const plate = (value: unknown) => code(value)?.replace(/\s+/g, ' ') ?? null

const flag = (value: unknown) => code(value) === 'Y'

const decimal = (value: unknown) => {
  const raw = text(value)

  if (raw === null) return null

  const number = Number(raw)

  return Number.isFinite(number) ? String(Math.round(number * 1000) / 1000) : null
}

const date = (value: unknown) =>
  value instanceof Date && !Number.isNaN(value.getTime()) ? value : null

export const sapLocation = (row: SapRow) => code(row.ZwbLoc)

export function sapVehicle(row: SapRow): VehicleInput | null {
  const plateNumber = plate(row.Nnopolisi)

  return plateNumber ? { plateNumber } : null
}

export function sapRelation(row: SapRow, type: 'B' | 'S'): RelationInput | null {
  const relationCode = code(type === 'B' ? row.Kunnr : row.Lifnr)

  if (!relationCode) return null

  return {
    code: relationCode,
    name: text(row.Name1) ?? relationCode,
    type,
    city: 'Ort01' in row ? text(row.Ort01) : undefined,
  }
}

export function wbTruck(row: SapRow): VehicleInput | null {
  const plateNumber = plate(row.Truck_Number)

  if (!plateNumber) return null

  const transporterCode = code(row.Transporter_Code)

  return {
    plateNumber,
    transporterCode,
    transporterName: transporterCode ? text(row.Transporter_Name) : null,
    tankerNumber: code(row.Tanker_No),
    tareMinKg: decimal(row.Min_Tare),
    tareMaxKg: decimal(row.Max_Tare),
    isBlacklisted: flag(row.Black_List),
  }
}

export function wbDriver(row: SapRow): DriverInput | null {
  const licenseNumber = text(row.License_No)

  if (!licenseNumber) return null

  return {
    licenseNumber,
    name: text(row.Name) ?? licenseNumber,
    address: text(row.Address),
    phone: text(row.Phone),
    birthPlace: text(row.Birth_Place),
    birthDate: date(row.Birth_Date),
    truckNumber: plate(row.Truck_Number),
    isBlacklisted: flag(row.Black_List),
  }
}

export function wbTransporter(row: SapRow): TransporterInput | null {
  const transporterCode = code(row.Transporter_Code)

  if (!transporterCode) return null

  return {
    code: transporterCode,
    name: text(row.Transporter_Name) ?? transporterCode,
    address: text(row.Address),
    phone: text(row.Phone),
    sapCode: text(row.SAP_Code),
    isBlacklisted: flag(row.Black_List),
  }
}

export function wbTanker(row: SapRow): TankerInput | null {
  const number = code(row.Tanker_No)

  if (!number) return null

  return {
    number,
    truckNumber: plate(row.Truck_Number),
    capacityKg: decimal(row.Capacity),
    checkMode: code(row.Check_Tanker),
    tolerancePercent: decimal(row.CheckTankerTol),
    toleranceKg: decimal(row.CheckTankerKG),
  }
}

/** wb_source rows carry a name; wb_source_mapping rows only the code. */
export function wbDestination(row: SapRow): DestinationInput | null {
  const destinationCode = code(row.Source_Code)

  if (!destinationCode) return null

  return {
    code: destinationCode,
    name: 'Description' in row ? text(row.Description) : undefined,
    storageLocation: 'Storage_Loc' in row ? text(row.Storage_Loc) : undefined,
  }
}

export function wbContract(row: SapRow, specs: SapRow[] = []): ContractInput | null {
  const doNumber = code(row.Do_No)

  if (!doNumber) return null

  return {
    doNumber,
    doDate: date(row.Do_Date),
    contractNumber: text(row.Contract),
    transactionCode: code(row.Transaction_Code) ?? '',
    commodityCode: text(row.Comm_Code),
    relationCode: code(row.Relation_Code),
    transporterCode: code(row.Transporter_Code),
    estateCode: code(row.Estate1_Code),
    piNumber: text(row.PI_No),
    quantityKg: decimal(row.Quantity),
    tolerancePercent: decimal(row.Tolerance),
    incoterm: code(row.Franco),
    soNumber: text(row.SO),
    soItem: text(row.SO_Item),
    stoNumber: text(row.STO),
    isClosed: code(row.closed) === 'X',
    closedAt: date(row.closed_date),
    qualities: specs.flatMap((spec) => {
      const sapCode = code(spec.SAP_Code)

      return sapCode
        ? [
            {
              sapCode,
              value: text(spec.SAP_Value),
            },
          ]
        : []
    }),
  }
}

export function wbTransactionType(row: SapRow): TransactionTypeInput | null {
  const typeCode = code(row.Transaction_Code)

  if (!typeCode) return null

  return {
    code: typeCode,
    name: text(row.Transaction_Name) ?? typeCode,
    direction: code(row.IO),
    isReturn: flag(row.is_return),
    isVessel: flag(row.is_vessel),
    requiresLoadingNote: flag(row.trx_require_internal_no),
    requiresTanker: flag(row.trx_require_tanker),
  }
}

export function wbCommodity(row: SapRow): CommodityInput | null {
  const commodityCode = text(row.Comm_Code)

  if (!commodityCode) return null

  return {
    code: commodityCode,
    name: text(row.Comm_Name) ?? commodityCode,
    unit: text(row.Unit),
    tolerancePercent: decimal(row.Tolerance),
    sapMaterialCode: text(row.Material) ?? text(row.SAP_Code),
  }
}

export function wbRelation(row: SapRow): RelationInput | null {
  const relationCode = code(row.Relation_Code)

  if (!relationCode) return null

  return {
    code: relationCode,
    name: text(row.Relation_Name) ?? relationCode,
    type: code(row.Relation_Type),
    city: text(row.City),
    isBlacklisted: flag(row.Black_List),
  }
}

export function wbEstate(row: SapRow): EstateInput | null {
  const estateCode = code(row.Estate_Code)

  if (!estateCode) return null

  return {
    code: estateCode,
    name: text(row.Estate_Name) ?? estateCode,
    city: text(row.City),
    sapCode: text(row.SAP_Code),
  }
}

/** WB.NET's "Kontrol Kualitas Item" screen is the wb_yield table. */
export function wbQualityItem(row: SapRow): QualityItemInput | null {
  const itemCode = code(row.Yield_Code)

  if (!itemCode) return null

  return {
    code: itemCode,
    name: text(row.Yield_Name) ?? itemCode,
    sapCode: code(row.SAP_Code),
  }
}
