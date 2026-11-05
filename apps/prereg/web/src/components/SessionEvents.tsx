import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authKeys, useAuth } from '@/hooks/auth'

export default function SessionEvents() {
  const queryClient = useQueryClient()
  const { user } = useAuth({ poll: true })

  useEffect(() => {
    if (!user) queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
  }, [user, queryClient])

  useEffect(() => {
    const expire = () => {
      void queryClient.cancelQueries().then(() => {
        queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
        queryClient.setQueryData(authKeys.session, null)
      })
    }

    window.addEventListener('awb-session-expired', expire)
    return () => window.removeEventListener('awb-session-expired', expire)
  }, [queryClient])

  return null
}
