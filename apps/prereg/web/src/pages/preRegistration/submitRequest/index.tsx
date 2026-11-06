import { useNavigate } from 'react-router'
import { useSubmitDriverRequest } from '@/hooks/driverRequest'
import RequestForm from '../_components/RequestForm'
import { getErrorMessage } from '@/utils/errorHandler'
import type { DriverRequestFormData } from '@/types/driverRequest'

export default function SubmitRequest() {
  const navigate = useNavigate()
  const submit = useSubmitDriverRequest()

  const handleSubmit = async (data: DriverRequestFormData) => {
    try {
      await submit.mutateAsync(data)
      navigate('/pre-registration', {
        state: { notice: 'Driver and vehicle request submitted successfully.' },
      })
    } catch {
      // Error is displayed by form
    }
  }

  return (
    <RequestForm
      isSubmitting={submit.isPending}
      error={submit.error ? getErrorMessage(submit.error) : undefined}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/pre-registration')}
    />
  )
}
