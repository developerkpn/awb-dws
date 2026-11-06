import type {
  AccountChoice,
  AccountProfile,
  AccountListItem,
  AccountSelectionFilters,
  AccountSortField,
  SortDirection,
} from '@awb/contracts'
import type { PaginatedResponse } from '@/types/api'

export type User = AccountProfile
export type Choice = AccountChoice

export interface UserFormData {
  name: string
  username: string
  email: string
  phone: string
  accountType: 'INTERNAL' | 'PARTNER'
  role: string
  plantIds: string[]
}

export interface UserFilters extends AccountSelectionFilters {
  sortBy: AccountSortField
  sortDirection: SortDirection
  q: string
  page: number
  limit: number
}

export interface UserOptions {
  roles: Choice[]
  plants: Choice[]
}

export type UsersResponse = PaginatedResponse<AccountListItem>
export type { AccountListItem } from '@awb/contracts'

export interface CreateUserResponse {
  user: User
  message: string
}

export interface UpdateUserInput {
  id: string
  data: UserFormData
}

export interface UpdateStatusInput {
  id: string
  isActive: boolean
}
