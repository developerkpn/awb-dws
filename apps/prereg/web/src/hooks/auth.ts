import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, fetchApi } from '@/utils/api'
import type { AuthQueryOptions, AuthResponse, LoginFormData } from '@/types/auth'

export const authKeys = { session: ['auth', 'session'] as const }

export function useAuth({ poll = false }: AuthQueryOptions = {}) {
  const queryClient = useQueryClient()
  const session = useQuery({
    queryKey: authKeys.session,
    queryFn: async ({ signal }) => {
      try {
        const response = await fetchApi<AuthResponse>('/auth/me', { signal })
        return response.user
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    staleTime: 15_000,
    refetchInterval: poll ? 60_000 : false,
    refetchIntervalInBackground: false,
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      fetchApi<AuthResponse>('/auth/login', { method: 'POST', data }),
    onSuccess: async (response) => {
      await queryClient.cancelQueries()
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
      queryClient.setQueryData(authKeys.session, response.user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => fetchApi<void>('/auth/logout', { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.cancelQueries()
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
      queryClient.setQueryData(authKeys.session, null)
    },
  })

  return {
    user: session.data ?? null,
    isAuthenticated: !!session.data,
    isLoading: session.isPending,
    error: session.error,
    refresh: session.refetch,
    loginMutation,
    logoutMutation,
  }
}
