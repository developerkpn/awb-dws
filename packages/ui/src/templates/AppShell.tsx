import { useState, type ReactNode } from 'react'
import { Button } from '../atoms/Button'
import { ThemeControl } from '../molecules/ThemeControl'
import '../styles/forms.css'

export type ShellPage = { key: string; label: string; element: ReactNode }
export function AppShell({ title, pages }: { title: string; pages: ShellPage[] }) {
  const [active, setActive] = useState(pages[0]?.key)

  return (
    <div className="ui-shell">
      <header className="ui-shell-header">
        <strong>{title}</strong>
        <nav>
          {pages.map((page) => (
            <Button
              key={page.key}
              variant={page.key === active ? 'primary' : 'secondary'}
              aria-pressed={page.key === active}
              onClick={() => setActive(page.key)}
            >
              {page.label}
            </Button>
          ))}
        </nav>
        <ThemeControl />
      </header>
      <main>{pages.find((page) => page.key === active)?.element}</main>
    </div>
  )
}
