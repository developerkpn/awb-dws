import ExcelJS from 'exceljs'
import type { SessionUser } from '@awb/contracts'
import { CustomError } from '@awb/server-core'
import { businessDate } from '../../lib/quantity'
import repository from './registration-report.repository'
import type {
  ReportExportQuery,
  ReportListQuery,
  ReportScope,
} from '../../types/registrationReport'

const REPORT_ROLES = ['CUSTOMER', 'VENDOR', 'ADMIN', 'LOGISTIC', 'COMMERCIAL'] as const
const MAX_EXPORT_ROWS = 10_000

async function resolveScope(user: SessionUser, partnerFilter?: string): Promise<ReportScope> {
  if (!REPORT_ROLES.includes(user.role as (typeof REPORT_ROLES)[number])) {
    throw new CustomError('Registration report is not available for this account role', 403)
  }

  if (user.role === 'CUSTOMER') {
    if (partnerFilter) {
      throw new CustomError('Only internal accounts can filter by customer or vendor', 403)
    }

    return {
      allowedTypes: ['JUL'],
      partnerId: user.id,
      isInternal: false,
    }
  }

  if (user.role === 'VENDOR') {
    if (partnerFilter) {
      throw new CustomError('Only internal accounts can filter by customer or vendor', 403)
    }

    return {
      allowedTypes: ['BEL'],
      partnerId: user.id,
      isInternal: false,
    }
  }

  if (user.role === 'ADMIN') {
    return {
      allowedTypes: ['JUL', 'BEL'],
      isInternal: true,
    }
  }

  const plantIds = await repository.userPlantIds(user.id)

  return {
    allowedTypes: ['JUL', 'BEL'],
    plantIds,
    isInternal: true,
  }
}

function safeSpreadsheetText(value: string | null | undefined) {
  if (!value) return ''

  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

export default {
  async list(query: ReportListQuery, user: SessionUser) {
    const scope = await resolveScope(user, query.partnerId)

    return repository.list(query, scope)
  },

  async options(user: SessionUser) {
    const scope = await resolveScope(user)

    if (!scope.isInternal) {
      const assigned = await repository.userPlantIds(user.id)

      return repository.options({
        ...scope,
        plantIds: assigned,
      })
    }

    return repository.options(scope)
  },

  async exportExcel(query: ReportExportQuery, user: SessionUser) {
    const scope = await resolveScope(user, query.partnerId)
    const { total, rows } = await repository.exportRows(query, scope, MAX_EXPORT_ROWS)

    if (total > MAX_EXPORT_ROWS) {
      throw new CustomError(
        `Export matches ${total} rows, exceeding the ${MAX_EXPORT_ROWS} row limit; narrow your filters and retry`,
        422,
      )
    }

    const workbook = new ExcelJS.Workbook()

    workbook.creator = 'AWB Downstream'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Registration Report', {
      views: [
        {
          state: 'frozen',
          ySplit: 1,
        },
      ],
    })

    sheet.columns = [
      {
        header: 'No. Registrasi',
        key: 'registrationNumber',
        width: 24,
      },
      {
        header: 'Jenis',
        key: 'type',
        width: 10,
      },
      {
        header: 'No. DO / PO',
        key: 'documentNumber',
        width: 18,
      },
      {
        header: 'Item PO',
        key: 'documentItem',
        width: 12,
      },
      {
        header: 'No. STO',
        key: 'stoNumber',
        width: 16,
      },
      {
        header: 'Kode Customer/Vendor',
        key: 'partnerCode',
        width: 20,
      },
      {
        header: 'Nama Customer/Vendor',
        key: 'partnerName',
        width: 30,
      },
      {
        header: 'Plant',
        key: 'plantName',
        width: 24,
      },
      {
        header: 'No. Loading Note',
        key: 'loadingNoteNumber',
        width: 22,
      },
      {
        header: 'Tanggal Request',
        key: 'requestDate',
        width: 16,
      },
      {
        header: 'Tanggal Muat',
        key: 'loadingDate',
        width: 16,
      },
      {
        header: 'SIM Supir',
        key: 'driverLicenseNumber',
        width: 22,
      },
      {
        header: 'Nama Supir',
        key: 'driverName',
        width: 24,
      },
      {
        header: 'Plat Kendaraan',
        key: 'vehiclePlateNumber',
        width: 18,
      },
      {
        header: 'Moda',
        key: 'mediaTransport',
        width: 10,
      },
      {
        header: 'Kuantitas Rencana',
        key: 'plannedQuantity',
        width: 18,
      },
      {
        header: 'UoM',
        key: 'uom',
        width: 10,
      },
      {
        header: 'Status',
        key: 'status',
        width: 16,
      },
    ]

    sheet.getRow(1).font = {
      bold: true,
    }

    for (const row of rows) {
      sheet.addRow({
        registrationNumber: safeSpreadsheetText(row.registrationNumber),
        type: row.type,
        documentNumber: safeSpreadsheetText(row.documentNumber),
        documentItem: safeSpreadsheetText(row.documentItem),
        stoNumber: safeSpreadsheetText(row.stoNumber),
        partnerCode: safeSpreadsheetText(row.partner.code),
        partnerName: safeSpreadsheetText(row.partner.name),
        plantName: safeSpreadsheetText(
          row.plant.sapPlantCode ? `${row.plant.sapPlantCode} - ${row.plant.name}` : row.plant.name,
        ),
        loadingNoteNumber: safeSpreadsheetText(row.loadingNoteNumber),
        requestDate: row.requestDate,
        loadingDate: row.loadingDate ?? '',
        driverLicenseNumber: safeSpreadsheetText(row.driverLicenseNumber),
        driverName: safeSpreadsheetText(row.driverName),
        vehiclePlateNumber: safeSpreadsheetText(row.vehiclePlateNumber),
        mediaTransport: safeSpreadsheetText(row.mediaTransport),
        plannedQuantity: Number(row.plannedQuantity),
        uom: safeSpreadsheetText(row.uom),
        status: row.status,
      })
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

    return {
      filename: `registration-report-${businessDate()}.xlsx`,
      buffer,
    }
  },
}
