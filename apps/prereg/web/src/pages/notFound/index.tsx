import { Link } from 'react-router'

export default function NotFound() {
  return (
    <section className="awb-card">
      <h1>Page not found</h1>
      <Link to="/">Back to overview</Link>
    </section>
  )
}
