import { useState, type ReactNode } from 'react'

export type ShellPage = { key: string; label: string; element: ReactNode }

/** Minimal shell with a page switcher. Replace with a router once real screens exist. */
export function AppShell({ title, pages }: { title: string; pages: ShellPage[] }) {
  const [active, setActive] = useState(pages[0]?.key)
  const page = pages.find((p) => p.key === active)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <header style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <strong>{title}</strong>
        <nav style={{ display: 'flex', gap: 8 }}>
          {pages.map((p) => (
            <button key={p.key} type="button" onClick={() => setActive(p.key)} disabled={p.key === active}>
              {p.label}
            </button>
          ))}
        </nav>
      </header>
      <main>{page?.element}</main>
    </div>
  )
}
