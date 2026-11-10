import { useId, useState, type ComponentPropsWithRef, type KeyboardEvent } from 'react'
import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined'
import { Skeleton } from '../atoms/Skeleton'
import '../styles/forms.css'
import '../styles/combobox.css'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

export interface ComboboxProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'value' | 'onChange' | 'onSelect'
> {
  value: string
  options: ComboboxOption[]
  onInputChange: (value: string) => void
  onSelect: (option: ComboboxOption) => void
  isLoading?: boolean
  emptyMessage?: string
  filterOptions?: boolean
}

export function Combobox({
  value,
  options,
  onInputChange,
  onSelect,
  isLoading = false,
  emptyMessage = 'No matches.',
  filterOptions = false,
  disabled,
  className = '',
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}: ComboboxProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const query = value.trim().toLowerCase()

  const matches = filterOptions
    ? options.filter((option) =>
        `${option.label} ${option.description ?? ''}`.toLowerCase().includes(query),
      )
    : options

  const expanded = open && !disabled
  const current = expanded ? matches[active] : undefined

  const choose = (option: ComboboxOption) => {
    onSelect(option)
    setOpen(false)
    setActive(-1)
  }

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)

    if (event.defaultPrevented) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)

      if (!matches.length) return

      const step = event.key === 'ArrowDown' ? 1 : -1

      setActive((index) => (index + step + matches.length) % matches.length)

      return
    }

    if (event.key === 'Enter' && current) {
      event.preventDefault()
      choose(current)

      return
    }

    if (event.key === 'Escape' && expanded) {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="ui-combobox" data-open={expanded || undefined}>
      <input
        {...props}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-busy={isLoading || undefined}
        aria-activedescendant={current ? `${listId}-${active}` : undefined}
        className={`ui-input ui-combobox-input ${className}`}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onInputChange(event.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={(event) => {
          onFocus?.(event)
          setOpen(true)
        }}
        onBlur={(event) => {
          onBlur?.(event)
          setOpen(false)
          setActive(-1)
        }}
        onKeyDown={keyDown}
      />
      {isLoading ? (
        <span aria-hidden="true" className="ui-combobox-spinner" />
      ) : (
        <KeyboardArrowDownOutlined aria-hidden="true" className="ui-combobox-icon" />
      )}
      <ul id={listId} role="listbox" className="ui-combobox-list" hidden={!expanded}>
        {isLoading &&
          [0, 1, 2].map((row) => (
            <li key={row} className="ui-combobox-loading" aria-hidden="true">
              <Skeleton
                style={{
                  width: `${70 - row * 15}%`,
                  height: '0.75rem',
                }}
              />
            </li>
          ))}
        {!isLoading &&
          matches.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              className="ui-combobox-option"
              data-active={index === active || undefined}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(option)}
            >
              <strong>{option.label}</strong>
              {option.description && <small>{option.description}</small>}
            </li>
          ))}
        {!isLoading && matches.length === 0 && (
          <li className="ui-combobox-empty" role="presentation">
            {emptyMessage}
          </li>
        )}
      </ul>
    </div>
  )
}
