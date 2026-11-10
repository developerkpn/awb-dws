import { Badge } from '@/ui/Badge'
import type { StatusBadgeProps } from '@/types/driverRequest'

export function StatusBadge({ status, requester = false }: StatusBadgeProps) {
  if (status === 'REJECTED') return <Badge variant="danger">Needs revision</Badge>

  if (requester)
    return status === 'SENT_TO_PLANT' ? (
      <Badge variant="active">Ready to use</Badge>
    ) : (
      <Badge variant="warning">In review</Badge>
    )

  switch (status) {
    case 'APPROVED':
      return <Badge variant="active">Approved · waiting for SAP</Badge>
    case 'SENT_TO_PLANT':
      return <Badge variant="info">Sent to plant</Badge>
    default:
      return <Badge variant="warning">Pending review</Badge>
  }
}
