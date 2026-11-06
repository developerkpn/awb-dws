import { useNavigate, useParams } from 'react-router'
import { RequestFormSkeleton } from '@/components/DriverRequestSkeleton'
import { useDriverRequest, useResubmitDriverRequest } from '@/hooks/driverRequest'
import ErrorState from '@/components/ErrorState'
import RequestForm from '../_components/RequestForm'
import { getErrorMessage } from '@/utils/errorHandler'
import type { DriverRequestFormData } from '@/types/driverRequest'

export default function EditRequest() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: request, isLoading, error, refetch } = useDriverRequest(id ?? '')
  const resubmit = useResubmitDriverRequest()

  if (isLoading) {
    return <RequestFormSkeleton />
  }

  if (error || !request) {
    return (
      <ErrorState
        message={error ? getErrorMessage(error) : 'Request data not found.'}
        onRetry={() => refetch()}
      />
    )
  }

  const handleSubmit = async (data: DriverRequestFormData) => {
    try {
      await resubmit.mutateAsync({ id: request.id, data })
      navigate('/pre-registration', {
        state: { notice: 'Revision request resubmitted successfully.' },
      })
    } catch {
      // Error handled by form
    }
  }

  return (
    <RequestForm
      request={request}
      isSubmitting={resubmit.isPending}
      error={resubmit.error ? getErrorMessage(resubmit.error) : undefined}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/pre-registration')}
    />
  )
}
