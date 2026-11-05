import { useNavigate } from 'react-router'
import { useCreateUser } from '@/hooks/user'
import UserForm from '@/pages/user/_components/UserForm'
import { getErrorMessage } from '@/utils/errorHandler'
import type { UserFormData } from '@/types/user'

export default function AddUser() {
  const navigate = useNavigate()
  const create = useCreateUser()

  const submit = async (data: UserFormData) => {
    try {
      const response = await create.mutateAsync(data)
      navigate('/users', { state: { notice: response.message } })
    } catch {
      // The mutation error is shown above the form.
    }
  }

  return (
    <UserForm
      isSubmitting={create.isPending}
      error={create.error ? getErrorMessage(create.error) : undefined}
      onSubmit={submit}
      onCancel={() => navigate('/users')}
    />
  )
}
