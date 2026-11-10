import { useId, useState, type ReactNode } from 'react'
import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined'
import '../styles/summary-popover.css'

interface SummaryPopoverProps {
  label: string
  summary: string
  preview: string
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

export function SummaryPopover({
  label,
  summary,
  preview,
  onOpenChange,
  children,
}: SummaryPopoverProps) {
  const id = useId()
  const [open, setOpen] = useState(false)

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 320,
  })

  return (
    <div className="ui-summary-popover">
      <button
        type="button"
        className="ui-summary-trigger"
        popoverTarget={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`View ${label}`}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const width = Math.min(352, innerWidth - 16)

          setPosition({
            width,
            left: Math.max(8, Math.min(rect.left, innerWidth - width - 8)),
            top: rect.bottom + 360 < innerHeight ? rect.bottom + 8 : Math.max(8, rect.top - 360),
          })
        }}
      >
        <span>
          <strong>{summary}</strong>
          <KeyboardArrowDownOutlined aria-hidden="true" />
        </span>
        <small>{preview}</small>
      </button>
      <div
        id={id}
        popover="auto"
        role="dialog"
        aria-label={label}
        className="ui-summary-menu"
        style={position}
        onToggle={(event) => {
          const expanded = event.newState === 'open'

          setOpen(expanded)
          onOpenChange?.(expanded)
        }}
      >
        {children}
      </div>
    </div>
  )
}
