import { PanelLeft, ChevronRight } from '@/ui/icons'
import { IconButton } from '@/ui/Button'
import type { NavbarProps } from '@/types/layout'

export default function Navbar({ title, collapsed, onToggle }: NavbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 px-4 sm:px-7">
      <IconButton
        label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls="app-sidebar"
        className="border-transparent! bg-transparent!"
      >
        <PanelLeft />
      </IconButton>
      <span className="h-4 w-px bg-stone-200" />
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="hidden text-stone-400 sm:inline">Workspace</span>
        <ChevronRight className="hidden size-4 text-stone-300 sm:block" />
        <span className="truncate font-medium text-stone-700">{title}</span>
      </div>
    </header>
  )
}
