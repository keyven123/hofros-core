import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LogoMark from '../components/common/LogoMark'
import { apiFetch } from '../utils/api'
import { setMarketingAuthenticated } from '../utils/auth'

function MarketingLoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
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
      return
    }

    setSubmitting(true)
    try {
      const data = await apiFetch('/v1/marketing/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (!data?.token) {
        setError('Unexpected response from the server. Please try again.')
        return
      }
      setMarketingAuthenticated({
        name: data.user?.name ?? '',
        email: data.user?.email ?? email,
        apiToken: data.token,
      })
      navigate('/marketing', { replace: true })
    } catch (requestError) {
      setError(requestError?.message || 'Sign in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen bg-[#f6f3ee]">
      <div className="mx-auto grid min-h-screen w-full max-w-5xl items-center px-4 py-10">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-[#e8e4dc] bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <Link to="/" aria-label="Hofros home">
            <LogoMark size="lg" />
          </Link>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a16207]">Marketing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0b1020]">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">Use the marketing account created in the admin console.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Email
              <input name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} className="mt-2 h-11 w-full rounded-xl border border-[#e8e4dc] px-3 text-sm normal-case tracking-normal text-slate-800" />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Password
              <input name="password" type="password" autoComplete="current-password" value={formData.password} onChange={handleChange} className="mt-2 h-11 w-full rounded-xl border border-[#e8e4dc] px-3 text-sm normal-case tracking-normal text-slate-800" />
            </label>
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            <button type="submit" disabled={submitting} className="h-11 w-full rounded-xl bg-[#0b1020] text-sm font-semibold text-[#e8c872] disabled:opacity-60">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default MarketingLoginPage
