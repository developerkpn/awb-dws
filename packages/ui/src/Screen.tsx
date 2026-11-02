import type { ReactNode } from 'react'

export function Screen({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      {children}
    </section>
  )
}
