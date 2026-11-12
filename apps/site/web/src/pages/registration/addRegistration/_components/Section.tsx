import type { SectionProps } from '@/types/registration'

export function Section({ id, step, title, description, action, invalid, children }: SectionProps) {
  return (
    <section
      id={`section-${id}`}
      aria-labelledby={`section-${id}-title`}
      className={`scroll-mt-4 rounded-2xl border bg-white p-5 sm:p-6 ${
        invalid ? 'border-brand-200 ring-1 ring-brand-200' : 'border-stone-200'
      }`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {step !== undefined && (
            <span
              aria-hidden="true"
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                invalid ? 'bg-brand-600 text-white' : 'bg-stone-900 text-stone-50'
              }`}
            >
              {step}
            </span>
          )}
          <div>
            <h2 id={`section-${id}-title`} className="text-base font-semibold text-stone-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
