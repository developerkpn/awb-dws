import { startTransition, useId, useOptimistic, useRef, useState } from 'react'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import '../styles/multiselect.css'

export interface MultiSelectOption {
  value: string
  label: string
  description?: string
}

export interface MultiSelectProps {
  label: string
  options: MultiSelectOption[]
  values: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
  maxSelections?: number
}

export function MultiSelect({
  label,
  options,
  values,
  onChange,
  disabled,
  maxSelections = 100,
}: MultiSelectProps) {
  const id = useId()
  const [selection, setSelection] = useOptimistic(values)
  const change = (next: string[]) =>
    startTransition(() => {
      setSelection(next)
      onChange(next)
    })
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 288 })
  const matches = options.filter((option) =>
    `${option.label} ${option.description ?? ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )
  const selected = new Set(selection)

  return (
    <div className="ui-multiselect">
      <button
        type="button"
        className="ui-multiselect-trigger"
        data-active={selection.length > 0}
        aria-label={`${label} filter${selection.length ? `, ${selection.length} selected` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={id}
        popoverTarget={id}
        disabled={disabled}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const width = Math.min(304, innerWidth - 16)
          setPosition({
            width,
            left: Math.max(8, Math.min(rect.left, innerWidth - width - 8)),
            top: rect.bottom + 360 < innerHeight ? rect.bottom + 8 : Math.max(8, rect.top - 360),
          })
        }}
      >
        <span>{label}</span>
        {selection.length > 0 && <span className="ui-multiselect-count">{selection.length}</span>}
        <KeyboardArrowDownOutlined aria-hidden="true" />
      </button>
      <div
        id={id}
        popover="auto"
        role="dialog"
        aria-label={`${label} filter`}
        className="ui-multiselect-menu"
        style={position}
        onToggle={(event) => {
          const expanded = event.newState === 'open'
          setOpen(expanded)
          if (expanded) searchRef.current?.focus()
          else setQuery('')
        }}
      >
        <div className="ui-multiselect-search">
          <Input
            ref={searchRef}
            leadingIcon={<SearchOutlined />}
            aria-label={`Search ${label.toLowerCase()}`}
            placeholder={`Search ${label.toLowerCase()}…`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="ui-multiselect-options" role="group" aria-label={`${label} options`}>
          {matches.map((option) => (
            <label
              key={option.value}
              className="ui-multiselect-option"
              data-selected={selected.has(option.value)}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={selected.has(option.value)}
                disabled={!selected.has(option.value) && selection.length >= maxSelections}
                onChange={(event) =>
                  change(
                    event.target.checked
                      ? [...selection, option.value]
                      : selection.filter((value) => value !== option.value),
                  )
                }
              />
              <span>
                <strong>{option.label}</strong>
                {option.description && <small>{option.description}</small>}
              </span>
            </label>
          ))}
          {matches.length === 0 && (
            <p className="ui-multiselect-empty">No matching {label.toLowerCase()}.</p>
          )}
        </div>
        <div className="ui-multiselect-footer">
          <Button
            variant="ghost"
            size="sm"
            disabled={selection.length === 0}
            onClick={() => change([])}
          >
            Clear selections
          </Button>
          <Button variant="secondary" size="sm" popoverTarget={id} popoverTargetAction="hide">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
