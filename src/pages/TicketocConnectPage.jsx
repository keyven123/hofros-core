import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'

const emptyForm = {
  email: '',
  password: '',
}

function TicketocConnectPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [testResult, setTestResult] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/v1/booking-portals/ticketoc/settings')
      const next = data?.settings ?? null
      setSettings(next)
      setForm({
        email: next?.email || '',
        password: '',
      })
    } catch (requestError) {
      setError(requestError?.message || 'Could not load Ticketoc settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function testConnection() {
    setBusy('test')
    setError('')
    setNotice('')
    setTestResult(null)
    try {
      const data = await apiFetch('/v1/booking-portals/ticketoc/test', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      })
      setTestResult(data?.result ?? null)
      setNotice(data?.message || 'Ticketoc credentials are valid.')
    } catch (requestError) {
      setError(requestError?.message || 'Connection test failed.')
    } finally {
      setBusy('')
    }
  }

  async function connect() {
    setBusy('connect')
    setError('')
    setNotice('')
    try {
      const data = await apiFetch('/v1/booking-portals/ticketoc/connect', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      })
      setSettings(data?.settings ?? null)
      setNotice(data?.message || 'Ticketoc connected.')
      setForm((prev) => ({ ...prev, password: '' }))
      setTimeout(() => navigate('/bookingportals'), 700)
    } catch (requestError) {
      setError(requestError?.message || 'Could not connect Ticketoc.')
    } finally {
      setBusy('')
    }
  }

  async function disconnect() {
    if (!window.confirm('Disconnect Ticketoc from Hofros? Sync will stop until you reconnect.')) return
    setBusy('disconnect')
    setError('')
    setNotice('')
    try {
      const data = await apiFetch('/v1/booking-portals/ticketoc/disconnect', { method: 'POST' })
      setSettings(data?.settings ?? null)
      setNotice(data?.message || 'Ticketoc disconnected.')
      setTestResult(null)
      setForm({ email: '', password: '' })
    } catch (requestError) {
      setError(requestError?.message || 'Could not disconnect Ticketoc.')
    } finally {
      setBusy('')
    }
  }

  const connected = Boolean(settings?.isConnected)
  const apiConfigured = settings?.apiConfigured !== false
  const canSubmit = apiConfigured && form.email.trim() && form.password

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <button
        type="button"
        onClick={() => navigate('/bookingportals')}
        className="mb-4 text-sm font-bold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        ← Back to Booking Portals
      </button>

      <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
        <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-sky-50 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-[4.75rem] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src="/portal-logos/ticketoc.png?v=3" alt="Ticketoc" className="h-full w-full object-contain p-1.5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0f3f73]">Ticketoc integration</h1>
              <p className="mt-1 text-sm text-slate-600">
                Sign in with your Ticketoc merchant email and password. Hofros sends this account&apos;s rooms and accommodations to that organization.
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {connected ? (
                  <span className="text-emerald-700">
                    ✓ Connected{settings?.organizationName ? ` · ${settings.organizationName}` : ''}
                  </span>
                ) : (
                  <span>✕ Not connected</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {loading ? <p className="text-sm text-slate-500">Loading Ticketoc settings…</p> : null}

          {notice ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
          ) : null}

          {!loading && !apiConfigured ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Ticketoc partner API is not configured yet. Ask a Hofros admin to set the Ticketoc API base URL under
              Partner integrations.
            </p>
          ) : null}
          {!loading && apiConfigured && settings?.stayConnected === false ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Ticketoc Stay is not connected yet. Ask a Hofros admin to paste the partner key and click Connect Stay.
            </p>
          ) : null}

          {!loading ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center">
                  <p className="text-lg font-black leading-none text-[#0f3f73]">
                    {connected ? settings?.listingCount ?? 0 : '—'}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Rooms</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center">
                  <p className="text-sm font-bold leading-none text-[#0f3f73]">
                    {connected && settings?.lastSync ? new Date(settings.lastSync).toLocaleString() : '—'}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Last sync</p>
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-800">Merchant email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder={settings?.emailMasked || 'merchant@example.com'}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-800">
                  Password{settings?.hasPassword ? ' (enter again to reconnect)' : ''}
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-16 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              {testResult ? (
                <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-950">
                  <p className="font-semibold">Test passed</p>
                  <p className="mt-1 text-xs">
                    Organization: {testResult.organizationName || testResult.organizationUuid || '—'}
                    {typeof testResult.listingCount === 'number' ? ` · ${testResult.listingCount} rooms ready to capture` : ''}
                  </p>
                </div>
              ) : null}

              {connected ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Org:</span>{' '}
                    {settings?.organizationName || settings?.organizationUuid || '—'}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">Rooms:</span> {settings?.listingCount ?? 0}
                    {settings?.lastSync ? ` · Last sync ${new Date(settings.lastSync).toLocaleString()}` : ''}
                  </p>
                  {settings?.lastError ? (
                    <p className="mt-1 text-rose-700">Last error: {settings.lastError}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                {connected ? (
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={disconnect}
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    {busy === 'disconnect' ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={Boolean(busy) || !canSubmit}
                  onClick={testConnection}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                >
                  {busy === 'test' ? 'Testing…' : 'Test connection'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy) || !canSubmit}
                  onClick={connect}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {busy === 'connect' ? 'Connecting…' : connected ? 'Reconnect' : 'Connect Ticketoc'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default TicketocConnectPage
