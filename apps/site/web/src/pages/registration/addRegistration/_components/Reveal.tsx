import { Plus } from '@/ui/icons'
import type { RevealProps } from '@/types/registration'

export function Reveal({ label, open, onOpen, children }: RevealProps) {
  if (open) return <>{children}</>

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
    >
      <Plus className="size-4" />
      {label}
    </button>
  )
}
