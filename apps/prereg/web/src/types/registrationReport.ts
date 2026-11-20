export interface RegistrationReportParams {
  page: number
  limit: number
  sortBy: string
  sortDirection: string
  dateField?: string
  dateFrom?: string
  dateTo?: string
  type?: string
  status?: string
  plantId?: string
  partnerId?: string
  search?: string
}
