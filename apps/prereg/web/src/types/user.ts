import type { AccountChoice, AccountPartner, AccountProfile } from '@awb/contracts'
import type { PaginatedResponse } from '@/types/api'

export type User = AccountProfile
export type Partner = AccountPartner
export type Choice = AccountChoice

export interface UserFormData {
  name: string
  username: string
  email: string
  phone: string
  accountType: 'INTERNAL' | 'PARTNER'
  role: string
  partnerIds: string[]
  plantIds: string[]
}

export interface UserFilters {
  q: string
  accountType: string
  role: string
  plantId: string
  page: number
  limit: number
}

export interface UserOptions {
  roles: Choice[]
  plants: Choice[]
  partners: Partner[]
}

export type UsersResponse = PaginatedResponse<User>

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
