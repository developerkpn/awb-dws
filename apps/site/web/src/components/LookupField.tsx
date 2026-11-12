import { useState } from 'react'
import type { MasterKind } from '@awb/contracts'
import { Combobox } from '@awb/ui'
import { useMasterList } from '@/hooks/master'
import { useDebounce } from '@/hooks/useDebounce'
import { Field } from '@/ui/Field'
import type { LookupFieldProps } from '@/types/master'

/** A search field that only accepts values picked from a SAP master; typed text is dropped on blur. */
export default function LookupField<K extends MasterKind>({
  kind,
  label,
  value,
  display,
  placeholder = 'Search…',
  required,
  error,
  hint,
  disabled,
  toOption,
  filter,
  onPick,
  onClear,
}: LookupFieldProps<K>) {
  const [query, setQuery] = useState<string | null>(null)
  const [typed, setTyped] = useState(false)
  const search = useDebounce(query ?? '', 250)
  const editing = query !== null

  const list = useMasterList(
    kind,
    {
      search: search || undefined,
      limit: 20,
    },
    editing && !disabled,
  )

  // Until results for the typed text arrive, show loading rather than suggestions for older text.
  const pending = editing && ((query ?? '') !== search || list.isFetching)
  const rows = pending ? [] : (list.data?.items ?? []).filter((row) => !filter || filter(row))

  const options = rows.map(toOption)

  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <Combobox
        value={query ?? display ?? value}
        options={options}
        isLoading={pending}
        disabled={disabled}
        placeholder={value ? (display ?? value) : placeholder}
        emptyMessage={search ? 'Nothing matches in the master.' : 'Type to search the master.'}
        onFocus={() => {
          setQuery('')
          setTyped(false)
        }}
        onBlur={() => {
          // Erasing the text and leaving clears an optional field; anything else keeps the pick.
          if (typed && query === '' && value && onClear) onClear()

          setQuery(null)
        }}
        onInputChange={(next) => {
          setQuery(next)
          setTyped(true)
        }}
        onSelect={(option) => {
          const row = rows[options.findIndex((item) => item.value === option.value)]

          if (row) onPick(row)

          setQuery(null)
        }}
      />
    </Field>
  )
}
