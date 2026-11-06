import type { ReactNode } from 'react'
import { Card, CardBody } from './Card'
export function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card>
      <div className="ui-form-section-heading">
        <span>{step}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <CardBody>{children}</CardBody>
    </Card>
  )
}
