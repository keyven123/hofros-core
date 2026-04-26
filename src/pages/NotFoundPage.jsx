import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">404</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h2>
      <p className="mt-3 text-sm text-slate-600">
        The page you are looking for does not exist in the hofros platform foundation.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
      >
        Back to Home
      </Link>
    </section>
  )
}

export default NotFoundPage
