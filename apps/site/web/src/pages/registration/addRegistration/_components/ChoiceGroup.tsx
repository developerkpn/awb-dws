import type { ChoiceGroupProps } from '@/types/registration'

export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  invalid,
}: ChoiceGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`min-w-28 flex-1 rounded-xl border px-4 py-2.5 text-left transition-colors ${
              selected
                ? 'border-stone-900 bg-stone-50 text-stone-900 ring-1 ring-stone-900'
                : invalid
                  ? 'border-brand-200 bg-white text-stone-700 hover:border-stone-300'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
            }`}
          >
            <span className="block text-sm font-semibold">{option.label}</span>
            {option.description && (
              <span className="mt-0.5 block text-xs text-stone-500">{option.description}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
