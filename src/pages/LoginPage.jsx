import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LogoMark from '../components/common/LogoMark'
import { apiFetch } from '../utils/api'
import { setMerchantAuthenticated } from '../utils/auth'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [errorPulse, setErrorPulse] = useState(0)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const email = formData.email.trim()
    const password = formData.password.trim()
    if (!email || !password) {
      setError('Please enter your email and password.')
      setErrorPulse((previous) => previous + 1)
      return
    }

    try {
      const data = await apiFetch('/v1/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (data?.token) {
        setMerchantAuthenticated({
          email: data.user?.email ?? email,
          merchantName: data.user?.merchant_name || data.user?.name || 'Merchant',
          apiToken: data.token,
        })
        navigate('/dashboard', { replace: true })
        return
      }

      setError('Unexpected response from the server. Please try again.')
      setErrorPulse((previous) => previous + 1)
      return
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
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#f8fcff] via-[#f4f9ff] to-[#eef6ff]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-stretch overflow-hidden px-4 py-8 md:grid-cols-2 md:px-6">
        <div className="fade-up flex items-start justify-center rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:rounded-r-none md:p-12">
          <div className="w-full max-w-md">
            <Link to="/" className="flex w-max shrink-0" aria-label="Hofros home">
              <LogoMark size="lg" />
            </Link>

            <Link
              to="/"
              className="mt-4 flex w-max items-center gap-2 text-sm font-semibold text-[#0c4a84] transition hover:text-[#0a3864]"
            >
              <span aria-hidden="true">←</span>
              Back to Home
            </Link>

            <p className="mt-4 flex w-fit rounded-full border border-amber-200 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              hofros account
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0e3f72] md:text-4xl">Login</h1>
            <p className="mt-2 text-sm text-slate-500">
              Access your booking dashboard and keep your properties running smoothly.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0c4a84] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0c4a84] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {error && (
                <p key={errorPulse} className="error-pop text-sm font-semibold text-rose-600">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link to="/" className="font-semibold text-[#0c4a84] transition hover:text-[#0a3864]">
                  Reset password
                </Link>
                <p className="text-slate-500">
                  No account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-amber-600 transition hover:text-amber-700"
                  >
                    Register
                  </Link>
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-3 text-sm font-bold text-[#0f3f72] shadow-[0_14px_26px_rgba(245,158,11,0.3)] transition hover:-translate-y-0.5"
              >
                Login
              </button>
            </form>
          </div>
        </div>

        <div className="fade-up relative mt-6 overflow-hidden rounded-3xl border border-blue-100 bg-[#0c4a84] p-8 text-white shadow-[0_30px_70px_rgba(15,63,114,0.35)] md:mt-0 md:rounded-l-none md:p-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-bold tracking-[0.2em] text-blue-100">why hofros</p>
            <h2 className="mt-3 max-w-md text-3xl font-black leading-tight md:text-4xl">
              The smart way to run your hotel booking platform
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-blue-100 md:text-base">
              hofros unifies reservations, guest communication, room inventory, and revenue insights in
              one platform so you can deliver better guest experiences and grow faster.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <article className="login-float rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.14em] text-blue-100">Real-time bookings</p>
                <p className="mt-2 text-2xl font-black">24/7 Sync</p>
                <p className="mt-1 text-sm text-blue-100">Avoid double bookings across channels.</p>
              </article>

              <article
                className="login-float rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur"
                style={{ animationDelay: '350ms' }}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-blue-100">Guest Experience</p>
                <p className="mt-2 text-2xl font-black">4.9/5</p>
                <p className="mt-1 text-sm text-blue-100">Faster response with automated messages.</p>
              </article>
            </div>

            <div className="login-orbit mt-8 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.14em] text-blue-100">Performance Snapshot</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white/15 p-3">
                  <p className="text-xl font-black">89%</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-blue-100">Occupancy</p>
                </div>
                <div className="rounded-xl bg-white/15 p-3">
                  <p className="text-xl font-black">+34%</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-blue-100">Revenue</p>
                </div>
                <div className="rounded-xl bg-white/15 p-3">
                  <p className="text-xl font-black">12k+</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-blue-100">Active Hosts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
