import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LogoMark from '../components/common/LogoMark'
import { apiFetch } from '../utils/api'
import { setAdminAuthenticated } from '../utils/auth'

function AdminLoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [errorPulse, setErrorPulse] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const email = formData.email.trim()
    const password = formData.password
    if (!email || !password) {
      setError('Please enter your email and password.')
      setErrorPulse((previous) => previous + 1)
      return
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailOk) {
      setError('Please enter a valid email address.')
      setErrorPulse((previous) => previous + 1)
      return
    }

    setSubmitting(true)
    try {
      const data = await apiFetch('/v1/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (data?.token) {
        setAdminAuthenticated({
          email: data.user?.email ?? email,
          apiToken: data.token,
        })
        navigate('/admin/dashboard', { replace: true })
        return
      }

      setError('Unexpected response from the server. Please try again.')
      setErrorPulse((previous) => previous + 1)
    } catch (requestError) {
      const status = requestError?.status
      const message =
        typeof requestError?.message === 'string' && requestError.message.trim()
          ? requestError.message.trim()
          : 'Sign in failed. Please try again.'

      if (status === 422 || status === 401) {
        setError(message)
        setErrorPulse((previous) => previous + 1)
        return
      }

      if (status === 0 || status == null) {
        setError(
          `${message} Start the hofros API (for example php artisan serve). For dev, check the Vite proxy; for production build, set APP_URL in ws/.env, then try again.`,
        )
        setErrorPulse((previous) => previous + 1)
        return
      }

      setError(message)
      setErrorPulse((previous) => previous + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-stretch overflow-hidden px-4 py-8 md:grid-cols-2 md:px-6">
        <div className="fade-up flex items-start justify-center rounded-3xl border border-slate-700/80 bg-slate-900/90 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur md:rounded-r-none md:p-12">
          <div className="w-full max-w-md">
            <Link to="/" className="flex w-max shrink-0" aria-label="Hofros home">
              <LogoMark size="lg" />
            </Link>

            <Link
              to="/"
              className="mt-4 flex w-max items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Back to Home
            </Link>

            <p className="mt-4 flex w-fit rounded-full border border-indigo-500/40 bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
              administrator
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">Admin sign in</h1>
            <p className="mt-2 text-sm text-slate-400">
              Sign in with your administrator email and password.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400"
                >
                  Email address
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
                />
              </div>

              {error && (
                <p key={errorPulse} className="error-pop text-sm font-semibold text-rose-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_26px_rgba(99,102,241,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        <div className="fade-up relative mt-6 overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950 to-slate-900 p-8 text-white shadow-[0_30px_70px_rgba(30,27,75,0.5)] md:mt-0 md:rounded-l-none md:p-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-bold tracking-[0.2em] text-indigo-200">admin console</p>
            <h2 className="mt-3 max-w-md text-3xl font-black leading-tight md:text-4xl">
              Secure access for platform administrators
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-indigo-100/90 md:text-base">
              Use this portal to manage system-level settings and oversight. Merchant dashboards stay on the
              standard login.
            </p>

            <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Merchant login</p>
              <p className="mt-2 text-sm text-indigo-100/85">
                Hotel and property operators should use the{' '}
                <Link to="/login" className="font-semibold text-white underline-offset-2 hover:underline">
                  merchant login
                </Link>{' '}
                instead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminLoginPage
