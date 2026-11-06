import type { ReactNode } from 'react'
import '../styles/forms.css'
export interface AuthLayoutProps {
  badge?: string
  heroTitle?: string
  heroDescription?: string
  heroBackgroundImage?: string
  logo?: ReactNode
  title: string
  subtitle?: string
  children: ReactNode
}
export function AuthLayout({
  badge,
  heroTitle,
  heroDescription,
  heroBackgroundImage = '/auth-hero-bg.jpg',
  logo,
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className="ui-auth-layout">
      <aside
        className="ui-auth-hero"
        style={{
          backgroundImage: `linear-gradient(#10182855,#101828d9),url("${heroBackgroundImage}")`,
        }}
      >
        {logo}
        <div>
          {badge && <small>{badge}</small>}
          <h1>{heroTitle}</h1>
          <p>{heroDescription}</p>
        </div>
      </aside>
      <main className="ui-auth-main">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  )
}
