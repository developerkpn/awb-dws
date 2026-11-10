import { useNavigate, useSearchParams } from 'react-router'
import { useSubmitDriverRequest } from '@/hooks/driverRequest'
import RequestForm from '../_components/RequestForm'
import { getErrorMessage } from '@/utils/errorHandler'
import type { DriverRequestFormData } from '@/types/driverRequest'

export default function SubmitDriverRequest() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const submit = useSubmitDriverRequest()
  const kind = searchParams.get('kind') === 'vehicle' ? 'VEHICLE' : 'DRIVER'
  const list = '/driver-requests' + (kind === 'VEHICLE' ? '?kind=vehicle' : '')

  const handleSubmit = async (data: DriverRequestFormData) => {
    try {
      await submit.mutateAsync(data)

      navigate(list, {
        state: {
          notice: kind === 'DRIVER' ? 'Driver request submitted.' : 'Vehicle request submitted.',
        },
      })
    } catch {
      // The form shows the error.
    }
  }

  return (
    <RequestForm
      key={kind}
      kind={kind}
      isSubmitting={submit.isPending}
      error={submit.error ? getErrorMessage(submit.error) : undefined}
      onSubmit={handleSubmit}
      onCancel={() => navigate(list)}
    />
  )
}
