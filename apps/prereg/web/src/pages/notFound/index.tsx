import { Link } from 'react-router'
import { SearchX } from '@/ui/icons'

export default function NotFound() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
      <SearchX className="size-12 text-stone-300" />
      <div>
        <h1 className="text-lg font-semibold text-stone-800">Page not found</h1>
        <p className="mt-1 text-sm text-stone-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        to="/"
        className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
      >
        Back to overview
      </Link>
    </div>
  )
}
