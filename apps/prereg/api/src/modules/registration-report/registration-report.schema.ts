import { z } from 'zod'
import {
  DEFAULT_PAGE_SIZE,
  registrationReportDateField,
  registrationReportSortFields,
  registrationReportStatus,
  registrationReportType,
  sortDirection,
} from '@awb/contracts'

const csvOrArray = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((raw) => {
    if (raw === undefined || raw === null || raw === '') return undefined

    const items = (Array.isArray(raw) ? raw : [raw])
      .flatMap((entry) => String(entry).split(','))
      .map((entry) => entry.trim())
      .filter(Boolean)

    return items.length ? items : undefined
  }, z.array(item).max(100).optional())

const baseFilterFields = {
  dateField: registrationReportDateField.default('request'),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
  type: registrationReportType.optional(),
  status: csvOrArray(registrationReportStatus),
  plantId: csvOrArray(z.uuid()),
  partnerId: z.uuid().optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(registrationReportSortFields).default('requestedAt'),
  sortDirection: sortDirection.optional(),
  sortOrder: sortDirection.optional(),
}

function validDateRange(value: { dateFrom?: string; dateTo?: string }) {
  return !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo
}

const dateRangeError = {
  message: 'Start date must be on or before end date',
  path: ['dateTo'],
}

export const reportExportQuery = z
  .object(baseFilterFields)
  .refine(validDateRange, dateRangeError)
  .transform(({ sortDirection: direction, sortOrder, ...rest }) => ({
    ...rest,
    sortDirection: direction ?? sortOrder ?? ('desc' as const),
  }))

export const reportListQuery = z
  .object({
    ...baseFilterFields,
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
  })
  .refine(validDateRange, dateRangeError)
  .transform(({ sortDirection: direction, sortOrder, ...rest }) => ({
    ...rest,
    sortDirection: direction ?? sortOrder ?? ('desc' as const),
  }))
