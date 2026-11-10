import type { ReactNode } from 'react'
import '../styles/forms.css'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`ui-card ${className}`}>{children}</section>
}
export function CardHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="ui-card-header">
      <div>{children}</div>
      {action}
    </div>
  )
}
export function CardBody({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`ui-card-body ${className}`}>{children}</div>
}
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="ui-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="ui-page-actions">{action}</div>}
    </div>
  )
}
