import { Link } from 'react-router'

export default function Forbidden() {
  return (
    <section className="awb-card">
      <h1>Access denied</h1>
      <p>Your account cannot access this page.</p>
      <Link to="/">Back to overview</Link>
    </section>
  )
}
