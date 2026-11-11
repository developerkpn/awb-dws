import type { RegistrationReportRow } from '@awb/contracts'
import { prisma } from '../../config/prisma'
import { Prisma } from '../../generated/prisma/client'
import { quantity, quantityText } from '../../lib/quantity'
import type {
  ReportExportQuery,
  ReportListQuery,
  ReportScope,
  StoredReportRow,
} from '../../types/registrationReport'

const JAKARTA_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function formatJakartaDate(value: Date) {
  return JAKARTA_DATE.format(value)
}

function escapeIlike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&')
}

function jakartaDayStartUtc(date: string) {
  return new Date(`${date}T00:00:00.000+07:00`)
}

function jakartaDayEndExclusiveUtc(date: string) {
  return new Date(jakartaDayStartUtc(date).getTime() + 86_400_000)
}

function whereClause(conditions: Prisma.Sql[]) {
  if (!conditions.length) return Prisma.empty

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
}

function orderClause(sortBy: ReportExportQuery['sortBy'], sortDirection: 'asc' | 'desc') {
  const dir = sortDirection === 'asc' ? Prisma.raw('ASC') : Prisma.raw('DESC')

  switch (sortBy) {
    case 'registrationNumber':
      return Prisma.sql`ORDER BY "registrationNumber" ${dir}, "id" ${dir}`
    case 'type':
      return Prisma.sql`ORDER BY "type" ${dir}, "id" ${dir}`
    case 'documentNumber':
      return Prisma.sql`ORDER BY "documentNumber" ${dir}, "documentItem" ${dir} NULLS LAST, "id" ${dir}`
    case 'partnerName':
      return Prisma.sql`ORDER BY "partnerName" ${dir}, "id" ${dir}`
    case 'plantName':
      return Prisma.sql`ORDER BY "plantName" ${dir}, "id" ${dir}`
    case 'loadingNoteNumber':
      return Prisma.sql`ORDER BY "loadingNoteNumber" ${dir} NULLS LAST, "id" ${dir}`
    case 'loadingDate':
      return Prisma.sql`ORDER BY "loadingDate" ${dir} NULLS LAST, "id" ${dir}`
    case 'driverName':
      return Prisma.sql`ORDER BY "driverName" ${dir} NULLS LAST, "id" ${dir}`
    case 'vehiclePlateNumber':
      return Prisma.sql`ORDER BY "vehiclePlateNumber" ${dir} NULLS LAST, "id" ${dir}`
    case 'plannedQuantity':
      return Prisma.sql`ORDER BY ("quantity"::numeric) ${dir}, "id" ${dir}`
    case 'status':
      return Prisma.sql`ORDER BY "status" ${dir}, "id" ${dir}`
    case 'requestedAt':
    default:
      return Prisma.sql`ORDER BY "requestedAt" ${dir}, "id" ${dir}`
  }
}

function commonConditions(query: ReportExportQuery, scope: ReportScope) {
  // Drafts are not registrations yet; partners see them in their own JUL and BEL lists.
  const conditions: Prisma.Sql[] = [Prisma.sql`l.status <> 'DRAFT'`]

  if (scope.plantIds) {
    if (!scope.plantIds.length) {
      conditions.push(Prisma.sql`FALSE`)
    } else {
      conditions.push(Prisma.sql`d.plant_id = ANY(${scope.plantIds}::uuid[])`)
    }
  }

  if (query.plantId?.length) {
    conditions.push(Prisma.sql`d.plant_id = ANY(${query.plantId}::uuid[])`)
  }

  if (query.status?.length) {
    conditions.push(Prisma.sql`l.status = ANY(${query.status}::text[])`)
  }

  if (query.dateField === 'loading') {
    if (query.dateFrom) {
      conditions.push(Prisma.sql`l.loading_date >= ${query.dateFrom}::date`)
    }

    if (query.dateTo) {
      conditions.push(Prisma.sql`l.loading_date <= ${query.dateTo}::date`)
    }
  } else {
    if (query.dateFrom) {
      conditions.push(
        Prisma.sql`COALESCE(r.submitted_at, r.created_at) >= ${jakartaDayStartUtc(query.dateFrom)}`,
      )
    }

    if (query.dateTo) {
      conditions.push(
        Prisma.sql`COALESCE(r.submitted_at, r.created_at) < ${jakartaDayEndExclusiveUtc(query.dateTo)}`,
      )
    }
  }

  return conditions
}

function julBranch(query: ReportExportQuery, scope: ReportScope) {
  const conditions = commonConditions(query, scope)

  if (scope.partnerId) {
    conditions.push(Prisma.sql`r.customer_id = ${scope.partnerId}::uuid`)
  }

  if (query.partnerId) {
    conditions.push(Prisma.sql`r.customer_id = ${query.partnerId}::uuid`)
  }

  if (query.search) {
    const pattern = '%' + escapeIlike(query.search) + '%'

    conditions.push(
      Prisma.sql`(
        r.number ILIKE ${pattern} ESCAPE '\\'
        OR d.reference_document ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(l.sto_number, '') ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(l.loading_note_number, '') ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(l.vehicle_plate_number, '') ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(l.driver_license_number, '') ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(l.driver_name, '') ILIKE ${pattern} ESCAPE '\\'
      )`,
    )
  }

  return Prisma.sql`
    SELECT
      l.id AS "id",
      r.id AS "registrationId",
      r.number AS "registrationNumber",
      'JUL'::text AS "type",
      d.reference_document AS "documentNumber",
      NULL::text AS "documentItem",
      l.sto_number AS "stoNumber",
      u.id AS "partnerId",
      u.username AS "partnerCode",
      u.name AS "partnerName",
      p.id AS "plantId",
      p.code AS "plantCode",
      p.sap_plant_code AS "sapPlantCode",
      p.name AS "plantName",
      l.loading_note_number AS "loadingNoteNumber",
      COALESCE(r.submitted_at, r.created_at) AS "requestedAt",
      l.loading_date AS "loadingDate",
      l.driver_license_number AS "driverLicenseNumber",
      l.driver_name AS "driverName",
      l.vehicle_plate_number AS "vehiclePlateNumber",
      l.media_transport AS "mediaTransport",
      l.quantity::text AS "quantity",
      COALESCE(l.document_snapshot->>'uom', '') AS "uom",
      l.status AS "status"
    FROM awb_jul_line l
    JOIN awb_jul_registration r ON r.id = l.registration_id
    JOIN mst_jul_document d ON d.id = l.document_id
    JOIN mst_plant p ON p.id = d.plant_id
    JOIN mst_user u ON u.id = r.customer_id
    ${whereClause(conditions)}
  `
}

function belBranch(query: ReportExportQuery, scope: ReportScope) {
  const conditions = commonConditions(query, scope)

  if (scope.partnerId) {
    conditions.push(Prisma.sql`r.vendor_id = ${scope.partnerId}::uuid`)
  }

  if (query.partnerId) {
    conditions.push(Prisma.sql`r.vendor_id = ${query.partnerId}::uuid`)
  }

  if (query.search) {
    const pattern = '%' + escapeIlike(query.search) + '%'

    conditions.push(
      Prisma.sql`(
        r.number ILIKE ${pattern} ESCAPE '\\'
        OR d.po_number ILIKE ${pattern} ESCAPE '\\'
        OR (d.po_number || '/' || d.po_item) ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(l.vehicle_plate_number, '') ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(l.driver_license_number, '') ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(l.driver_name, '') ILIKE ${pattern} ESCAPE '\\'
      )`,
    )
  }

  return Prisma.sql`
    SELECT
      l.id AS "id",
      r.id AS "registrationId",
      r.number AS "registrationNumber",
      'BEL'::text AS "type",
      d.po_number AS "documentNumber",
      d.po_item AS "documentItem",
      NULL::text AS "stoNumber",
      u.id AS "partnerId",
      u.username AS "partnerCode",
      u.name AS "partnerName",
      p.id AS "plantId",
      p.code AS "plantCode",
      p.sap_plant_code AS "sapPlantCode",
      p.name AS "plantName",
      NULL::text AS "loadingNoteNumber",
      COALESCE(r.submitted_at, r.created_at) AS "requestedAt",
      l.loading_date AS "loadingDate",
      l.driver_license_number AS "driverLicenseNumber",
      l.driver_name AS "driverName",
      l.vehicle_plate_number AS "vehiclePlateNumber",
      l.media_transport AS "mediaTransport",
      l.quantity::text AS "quantity",
      COALESCE(l.document_snapshot->>'uom', '') AS "uom",
      l.status AS "status"
    FROM awb_bel_line l
    JOIN awb_bel_registration r ON r.id = l.registration_id
    JOIN mst_bel_document d ON d.id = l.document_id
    JOIN mst_plant p ON p.id = d.plant_id
    JOIN mst_user u ON u.id = r.vendor_id
    ${whereClause(conditions)}
  `
}

function buildUnion(query: ReportExportQuery, scope: ReportScope) {
  const branches: Prisma.Sql[] = []

  if (scope.allowedTypes.includes('JUL') && (!query.type || query.type === 'JUL')) {
    branches.push(julBranch(query, scope))
  }

  if (scope.allowedTypes.includes('BEL') && (!query.type || query.type === 'BEL')) {
    branches.push(belBranch(query, scope))
  }

  if (!branches.length) return null

  return Prisma.join(branches, ' UNION ALL ')
}

function mapRow(row: StoredReportRow): RegistrationReportRow {
  return {
    id: row.id,
    registrationId: row.registrationId,
    registrationNumber: row.registrationNumber,
    type: row.type,
    documentNumber: row.documentNumber,
    documentItem: row.documentItem,
    stoNumber: row.stoNumber,
    partner: {
      id: row.partnerId,
      code: row.partnerCode,
      name: row.partnerName,
    },
    plant: {
      id: row.plantId,
      code: row.plantCode,
      sapPlantCode: row.sapPlantCode,
      name: row.plantName,
    },
    loadingNoteNumber: row.loadingNoteNumber,
    requestedAt: row.requestedAt.toISOString(),
    requestDate: formatJakartaDate(row.requestedAt),
    loadingDate: row.loadingDate ? row.loadingDate.toISOString().slice(0, 10) : null,
    driverLicenseNumber: row.driverLicenseNumber,
    driverName: row.driverName,
    vehiclePlateNumber: row.vehiclePlateNumber,
    mediaTransport: row.mediaTransport,
    plannedQuantity: quantityText(quantity(row.quantity)),
    uom: row.uom,
    status: row.status as RegistrationReportRow['status'],
  }
}

export default {
  async userPlantIds(userId: string) {
    const rows = await prisma.userPlant.findMany({
      where: {
        userId,
      },
      select: {
        plantId: true,
      },
    })

    return rows.map((row) => row.plantId)
  },

  async list(query: ReportListQuery, scope: ReportScope) {
    const union = buildUnion(query, scope)

    if (!union) {
      return {
        items: [],
        total: 0,
        page: query.page,
        limit: query.limit,
      }
    }

    const order = orderClause(query.sortBy, query.sortDirection)
    const offset = (query.page - 1) * query.limit

    const { total, rows } = await prisma.$transaction(
      async (tx) => {
        const countRows = await tx.$queryRaw<{ count: bigint }[]>(
          Prisma.sql`SELECT COUNT(*)::bigint AS "count" FROM (${union}) AS report_rows`,
        )

        const rawRows = await tx.$queryRaw<StoredReportRow[]>(
          Prisma.sql`SELECT * FROM (${union}) AS report_rows ${order} LIMIT ${query.limit} OFFSET ${offset}`,
        )

        return {
          total: Number(countRows[0]?.count ?? 0n),
          rows: rawRows,
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    )

    return {
      items: rows.map(mapRow),
      total,
      page: query.page,
      limit: query.limit,
    }
  },

  async exportRows(query: ReportExportQuery, scope: ReportScope, maxRows: number) {
    const union = buildUnion(query, scope)

    if (!union) {
      return {
        total: 0,
        rows: [] as RegistrationReportRow[],
      }
    }

    const order = orderClause(query.sortBy, query.sortDirection)

    return prisma.$transaction(
      async (tx) => {
        const countRows = await tx.$queryRaw<{ count: bigint }[]>(
          Prisma.sql`SELECT COUNT(*)::bigint AS "count" FROM (${union}) AS report_rows`,
        )

        const total = Number(countRows[0]?.count ?? 0n)

        if (total > maxRows) {
          return {
            total,
            rows: [] as RegistrationReportRow[],
          }
        }

        const rawRows = await tx.$queryRaw<StoredReportRow[]>(
          Prisma.sql`SELECT * FROM (${union}) AS report_rows ${order} LIMIT ${maxRows}`,
        )

        return {
          total,
          rows: rawRows.map(mapRow),
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    )
  },

  async options(scope: ReportScope) {
    const plants = await prisma.plant.findMany({
      where: {
        isActive: true,
        ...(scope.plantIds
          ? {
              id: {
                in: scope.plantIds,
              },
            }
          : {}),
      },
      select: {
        id: true,
        code: true,
        sapPlantCode: true,
        name: true,
      },
      orderBy: [{ name: 'asc' }, { code: 'asc' }],
    })

    if (!scope.isInternal) {
      return {
        plants,
        partners: [],
      }
    }

    const partnerRows = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          code: {
            in: ['CUSTOMER', 'VENDOR'],
          },
        },
        ...(scope.plantIds
          ? {
              plants: {
                some: {
                  plantId: {
                    in: scope.plantIds,
                  },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: {
          select: {
            code: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }, { username: 'asc' }],
    })

    return {
      plants,
      partners: partnerRows.map((partner) => ({
        id: partner.id,
        code: partner.username,
        name: partner.name,
        type: (partner.role.code === 'VENDOR' ? 'BEL' : 'JUL') as 'JUL' | 'BEL',
      })),
    }
  },
}
