import { z } from 'zod'

export const sortDirection = z.enum(['asc', 'desc'])
export type SortDirection = z.infer<typeof sortDirection>

export const accountSortFields = [
  'createdAt',
  'name',
  'username',
  'email',
  'accountType',
  'role',
  'sapCode',
  'plantAccess',
  'isActive',
] as const
export const roleSortFields = [
  'code',
  'name',
  'description',
  'permissionCount',
  'isActive',
] as const
export const permissionSortFields = ['module', 'name', 'code', 'action'] as const
export const driverRequestSortFields = [
  'driverName',
  'driverLicenseNumber',
  'vehiclePlateNumber',
  'createdAt',
  'status',
] as const
export type DriverRequestSortField = (typeof driverRequestSortFields)[number]

export const accountSortingQuery = z.object({
  sortBy: z.enum(accountSortFields).default('createdAt'),
  sortDirection: sortDirection.default('desc'),
})
export const roleSortingQuery = z.object({
  sortBy: z.enum(roleSortFields).default('code'),
  sortDirection: sortDirection.default('asc'),
})
export const permissionSortingQuery = z.object({
  sortBy: z.enum(permissionSortFields).default('module'),
  sortDirection: sortDirection.default('asc'),
})

export type AccountSortField = (typeof accountSortFields)[number]
export type RoleSortField = (typeof roleSortFields)[number]
export type PermissionSortField = (typeof permissionSortFields)[number]
