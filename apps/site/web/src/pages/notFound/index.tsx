import { Link } from 'react-router'
import { PageHeader } from '@/ui/Card'

export default function NotFound() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Page not found"
        subtitle="This address does not exist in the plant console."
      />
      <Link to="/registrations" className="text-sm font-medium text-brand-700 hover:text-brand-800">
        Back to registrations
      </Link>
    </div>
  )
}
