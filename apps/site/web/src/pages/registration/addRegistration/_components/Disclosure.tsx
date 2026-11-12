import { useState } from 'react'
import { ChevronRight } from '@/ui/icons'
import type { DisclosureProps } from '@/types/registration'

export function Disclosure({ title, summary, defaultOpen = false, children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-stone-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <ChevronRight
          className={`size-4 text-stone-400 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <span className="text-sm font-medium text-stone-800">{title}</span>
        {summary && <span className="ml-auto text-xs text-stone-500">{summary}</span>}
      </button>
      {open && <div className="border-t border-stone-100 px-4 py-4">{children}</div>}
    </div>
  )
}
