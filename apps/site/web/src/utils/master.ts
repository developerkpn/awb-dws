import type { MasterPullStatus } from '@awb/contracts'
import { formatDateTime } from '@/utils/date'

export function pullSummary(status: MasterPullStatus | undefined) {
  if (!status) return ''

  if (status.lastPulledAt)
    return `Last pulled from SAP ${formatDateTime(status.lastPulledAt)}${status.lastPullStatus === 'FAILED' ? ' (failed)' : ''}`

  if (status.lastBackfilledAt)
    return `Backfilled from WB.NET ${formatDateTime(status.lastBackfilledAt)}`

  return 'Never pulled'
}
