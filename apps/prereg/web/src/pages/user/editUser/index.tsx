import { useNavigate, useParams } from 'react-router'
import { useUser, useUpdateUser } from '@/hooks/user'
import UserForm from '@/pages/user/_components/UserForm'
import ErrorState from '@/components/ErrorState'
import LoadingState from '@/components/LoadingState'
import { getErrorMessage } from '@/utils/errorHandler'
import type { UserFormData } from '@/types/user'

export default function EditUser() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useUser(id)
  const update = useUpdateUser()

  if (user.isPending) return <LoadingState message="Loading account…" />
  if (user.error)
    return <ErrorState message={getErrorMessage(user.error)} onRetry={() => void user.refetch()} />
  if (!user.data) return <ErrorState message="Account not found." />

  const submit = async (data: UserFormData) => {
    try {
      await update.mutateAsync({ id, data })
      navigate('/users', { state: { notice: 'Account updated.' } })
    } catch {
      // error shown by form
    }
  }

  return (
    <UserForm
      key={user.data.id}
      user={user.data}
      isSubmitting={update.isPending}
      error={update.error ? getErrorMessage(update.error) : undefined}
      onSubmit={submit}
      onCancel={() => navigate('/users')}
    />
  )
}
