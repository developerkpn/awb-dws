import { useNavigate } from 'react-router'
import { Button, PageHeader } from '@awb/ui'
import { useAuth } from '@/hooks/auth'
import { hasPermission } from '@/utils/permission'
import { PERMISSION } from '@/constant/PERMISSION'
import { Plus } from '@/ui/icons'

export default function ListBel({ review = false }: { review?: boolean }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        title={review ? 'BEL review' : 'BEL registrations'}
        subtitle={
          review
            ? 'Review and approve purchase registrations from vendors'
            : 'Register purchase deliveries against your Purchase Orders'
        }
        action={
          !review && hasPermission(user, PERMISSION.PREREG.CREATE) ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate('/bel/new')}
              className="gap-2"
            >
              <Plus className="size-4" />
              New BEL registration
            </Button>
          ) : undefined
        }
      />

      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-stone-900">
          {review ? 'No pending BEL registrations to review' : 'No BEL registrations yet'}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          {review
            ? 'When vendors submit registrations against open POs, they will appear here for review.'
            : 'Create a registration to allocate quantities from your Purchase Orders to trucks.'}
        </p>
      </div>
    </div>
  )
}
