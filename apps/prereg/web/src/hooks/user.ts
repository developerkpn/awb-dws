import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountListItem, accountProfile } from '@awb/contracts'
import { authKeys } from '@/hooks/auth'
import { fetchApi } from '@/utils/api'
import type { MutationMessage } from '@/types/api'
import type {
  CreateUserResponse,
  UpdateStatusInput,
  UpdateUserInput,
  User,
  UserFilters,
  UserFormData,
  UserOptions,
  UsersResponse,
} from '@/types/user'

export const userKeys = {
  all: ['users'] as const,
  lists: ['users', 'list'] as const,
  list: (filters: UserFilters) => ['users', 'list', filters] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
  options: () => ['users', 'options'] as const,
}

export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async ({ signal }) => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) =>
          Array.isArray(value) ? value.length > 0 : value !== '',
        ),
      )
      const response = await fetchApi<UsersResponse>('/users', {
        params,
        signal,
        paramsSerializer: { indexes: null },
      })
      return { ...response, items: accountListItem.array().parse(response.items) }
    },
  })
}

export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async ({ signal }) =>
      accountProfile.parse(await fetchApi<User>(`/users/${id}`, { signal })),
    enabled: !!id && enabled,
  })
}

export function useUserOptions() {
  return useQuery({
    queryKey: userKeys.options(),
    queryFn: ({ signal }) => fetchApi<UserOptions>('/users/options', { signal }),
    staleTime: 60_000,
  })
}

function useInvalidateUsers() {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: userKeys.all }),
      queryClient.invalidateQueries({ queryKey: authKeys.session }),
    ])
  }
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (data: UserFormData) =>
      fetchApi<CreateUserResponse>('/users', { method: 'POST', data }),
    onSuccess: invalidate,
  })
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, data }: UpdateUserInput) =>
      fetchApi<User>(`/users/${id}`, { method: 'PUT', data }),
    onSuccess: invalidate,
  })
}

export function useUpdateUserStatus() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ id, isActive }: UpdateStatusInput) =>
      fetchApi<User>(`/users/${id}/status`, { method: 'PATCH', data: { isActive } }),
    onSuccess: invalidate,
  })
}

export function useResetUserPassword() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<MutationMessage>(`/users/${id}/reset-password`, { method: 'POST' }),
    onSuccess: invalidate,
  })
}
