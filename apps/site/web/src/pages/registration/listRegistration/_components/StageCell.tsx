import type { RegistrationStatus } from '@awb/contracts'
import type { RegistrationCellProps } from '@/types/registration'

const CURRENT: Record<RegistrationStatus, string> = {
  ACTIVE: 'bg-brand-600',
  ON_HOLD: 'bg-amber-500',
  REJECTED: 'bg-rose-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-stone-300',
}

const PILL: Partial<Record<RegistrationStatus, [string, string]>> = {
  ON_HOLD: ['On hold', 'bg-amber-50 text-amber-800 ring-amber-200'],
  REJECTED: ['Rejected', 'bg-rose-50 text-rose-700 ring-rose-200'],
}

export function StageCell({ row }: RegistrationCellProps) {
  const { status, stage, flow } = row
  const finished = status === 'COMPLETED' || status === 'CANCELLED'
  const pill = PILL[status]

  const segment = (step: number) => {
    if (status === 'COMPLETED') return CURRENT.COMPLETED

    if (status === 'CANCELLED') return step <= stage.step ? CURRENT.CANCELLED : 'bg-stone-100'

    if (step < stage.step) return 'bg-brand-200'

    return step === stage.step ? CURRENT[status] : 'bg-stone-200'
  }

  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium text-stone-900">
          {status === 'COMPLETED' ? 'Completed' : status === 'CANCELLED' ? 'Cancelled' : stage.name}
        </span>
        {pill && (
          <span
            className={`inline-flex rounded-full px-1.5 py-px text-[11px] font-medium whitespace-nowrap ring-1 ${pill[1]}`}
          >
            {pill[0]}
          </span>
        )}
      </p>
      <div
        className="mt-1.5 flex gap-0.5"
        role="img"
        aria-label={`Step ${stage.step} of ${stage.steps}`}
      >
        {Array.from({ length: stage.steps }, (_, index) => (
          <span key={index} className={`h-1.5 flex-1 rounded-full ${segment(index + 1)}`} />
        ))}
      </div>
      <p className="mt-1 truncate text-xs text-stone-500">
        {finished ? flow.name : `Step ${stage.step} of ${stage.steps} · ${flow.name}`}
      </p>
    </div>
  )
}
