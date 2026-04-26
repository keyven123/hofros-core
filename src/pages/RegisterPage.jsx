import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'
import { setMerchantAuthenticated } from '../utils/auth'

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    merchantName: '',
    firstName: '',
    lastName: '',
    contactNumber: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    const requiredFields = [
      'merchantName',
      'firstName',
      'lastName',
      'contactNumber',
      'address',
      'email',
      'password',
      'confirmPassword',
    ]
    const hasEmptyField = requiredFields.some((field) => !formData[field].trim())
    if (hasEmptyField) {
      setError('Please complete all required fields.')
      setErrorPulse((previous) => previous + 1)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      setErrorPulse((previous) => previous + 1)
      return
    }

    try {
      const data = await apiFetch('/v1/register', {
        method: 'POST',
        body: JSON.stringify({
          merchant_name: formData.merchantName,
          first_name: formData.firstName,
          last_name: formData.lastName,
          contact_number: formData.contactNumber,
          address: formData.address,
          email: formData.email.trim(),
          password: formData.password,
          password_confirmation: formData.confirmPassword,
        }),
      })

      if (data?.token) {
        setMerchantAuthenticated({
          email: data.user?.email ?? formData.email.trim(),
          merchantName: data.user?.merchant_name ?? formData.merchantName,
          apiToken: data.token,
        })
        navigate('/dashboard', { replace: true })
        return
      }
    } catch (error) {
      const status = error?.status
      const message =
        typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : 'Registration failed.'

      if (status === 422 && error.body?.errors) {
        const messages = Object.values(error.body.errors).flat()
        setError(messages[0] || message)
        setErrorPulse((previous) => previous + 1)
        return
      }
      if (status === 422 || status === 401) {
        setError(message)
        setErrorPulse((previous) => previous + 1)
        return
      }
      if (status && status !== 0) {
        setError(message)
        setErrorPulse((previous) => previous + 1)
        return
      }

      setError(
        `${message} Start the hofros API. For dev, check the Vite proxy; for production, set APP_URL in ws/.env, then try again.`,
      )
      setErrorPulse((previous) => previous + 1)
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#f8fcff] via-[#f4f9ff] to-[#eef6ff]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-stretch overflow-hidden px-4 py-8 md:grid-cols-2 md:px-6">
        <div className="fade-up relative overflow-hidden rounded-3xl border border-blue-100 bg-[#0c4a84] p-8 text-white shadow-[0_30px_70px_rgba(15,63,114,0.35)] md:rounded-r-none md:p-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Why Register</p>
            <h1 className="mt-3 max-w-md text-3xl font-black leading-tight md:text-4xl">
              Create your hofros account and grow your business faster
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-blue-100 md:text-base">
              Register in hofros to centralize your bookings, manage hotel operations, and track
              performance from one reliable platform built for modern property teams.
            </p>

            <div className="mt-8 space-y-4">
              <article className="login-float rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-white">One dashboard for all hotel operations</p>
                <p className="mt-1 text-sm text-blue-100">
                  Keep reservations, room inventory, and guest messaging in one place.
                </p>
              </article>

              <article
                className="login-float rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur"
                style={{ animationDelay: '300ms' }}
              >
                <p className="text-sm font-semibold text-white">Built for teams and representatives</p>
                <p className="mt-1 text-sm text-blue-100">
                  Secure account access for merchant owners and authorized staff.
                </p>
              </article>
            </div>

            <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-blue-100">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-amber-200 transition hover:text-amber-100">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="fade-up mt-6 flex items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:mt-0 md:rounded-l-none md:p-12">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0c4a84] transition hover:text-[#0a3864]"
            >
              <span aria-hidden="true">←</span>
              Back to Home
            </Link>

            <p className="mt-4 flex w-fit rounded-full border border-amber-200 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              hofros account
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0e3f72] md:text-4xl">Register</h2>
            <p className="mt-2 text-sm text-slate-500">Create your merchant account in minutes.</p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="merchantName"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  Merchant Name
                </label>
                <input
                  id="merchantName"
                  name="merchantName"
                  type="text"
                  placeholder="Enter merchant name"
                  value={formData.merchantName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0c4a84] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                  >
                    Representative First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0c4a84] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                  >
                    Representative Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0c4a84] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contactNumber"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  Contact Number
                </label>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  placeholder="+63 900 123 4567"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0c4a84] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Enter business address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0c4a84] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  Email Address
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

              <div className="grid gap-4 sm:grid-cols-2">
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
                    autoComplete="new-password"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0c4a84] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0c4a84] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {error && (
                <p key={errorPulse} className="error-pop text-sm font-semibold text-rose-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-3 text-sm font-bold text-[#0f3f72] shadow-[0_14px_26px_rgba(245,158,11,0.3)] transition hover:-translate-y-0.5"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
