import { PackageOpen } from '@/ui/icons'
import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
      <div className="mb-3 text-stone-300">{icon ?? <PackageOpen className="size-10" />}</div>
      <p className="text-sm font-medium text-stone-800">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-stone-500">{children}</div>}
    </div>
  )
}
