import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'

function AirbnbConnectPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  const [userId, setUserId] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [testResult, setTestResult] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/v1/booking-portals/airbnb/ota/settings')
      const next = data?.settings ?? null
      setSettings(next)
      setUserId(next?.values?.userId?.value || '')
    } catch (requestError) {
      setError(requestError?.message || 'Could not load Airbnb settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const connected = Boolean(settings?.isConnected)
  const apiConfigured = settings?.apiConfigured !== false
  const canSubmit = apiConfigured && /^\d{5,20}$/.test(String(userId || '').trim())

  async function testConnection() {
    setBusy('test')
    setError('')
    setNotice('')
    setTestResult(null)
    try {
      const data = await apiFetch('/v1/booking-portals/airbnb/ota/test', {
        method: 'POST',
        body: JSON.stringify({ userId: String(userId).trim() }),
      })
      setTestResult(data?.result ?? null)
      setNotice(data?.message || 'Airbnb User ID is valid.')
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
      const data = await apiFetch('/v1/booking-portals/airbnb/ota/connect', {
        method: 'POST',
        body: JSON.stringify({ userId: String(userId).trim() }),
      })
      setSettings(data?.settings ?? null)
      setNotice(data?.message || 'Airbnb connected.')
      setTimeout(() => navigate('/bookingportals'), 700)
    } catch (requestError) {
      setError(requestError?.message || 'Could not connect Airbnb.')
    } finally {
      setBusy('')
    }
  }

  async function disconnect() {
    if (!window.confirm('Disconnect Airbnb from Hofros? All User IDs and mappings will be cleared.')) return
    setBusy('disconnect')
    setError('')
    setNotice('')
    try {
      const data = await apiFetch('/v1/booking-portals/airbnb/ota/disconnect', { method: 'POST' })
      setSettings(data?.settings ?? null)
      setNotice(data?.message || 'Airbnb disconnected.')
      setTestResult(null)
      setUserId('')
    } catch (requestError) {
      setError(requestError?.message || 'Could not disconnect Airbnb.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <button
        type="button"
        onClick={() => navigate('/bookingportals')}
        className="mb-4 text-sm font-bold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        ← Back to Booking Portals
      </button>

      <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
        <div className="border-b border-rose-100 bg-gradient-to-r from-[#fff5f5] via-white to-[#fff8f0] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-[4.75rem] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src="/portal-logos/airbnb.svg?v=3" alt="Airbnb" className="h-full w-full object-contain p-1.5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0f3f73]">Airbnb integration</h1>
              <p className="mt-1 text-sm text-slate-600">
                Connect with your Airbnb User ID so Hofros can capture listings and map them to your accommodations.
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {connected ? (
                  <span className="text-emerald-700">
                    ✓ Connected
                    {settings?.hostCount
                      ? ` · ${settings.hostCount} User ID${settings.hostCount === 1 ? '' : 's'}`
                      : settings?.propertyId
                        ? ` · ${settings.propertyId}`
                        : ''}
                  </span>
                ) : (
                  <span>✕ Not connected</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {loading ? <p className="text-sm text-slate-500">Loading Airbnb settings…</p> : null}

          {notice ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
          ) : null}

          {!loading && !apiConfigured ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Airbnb partner API is not configured yet. Ask a Hofros admin to set the Airbnb API base URL under Partner
              integrations.
            </p>
          ) : null}

          {!loading ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center">
                  <p className="text-lg font-black leading-none text-[#0f3f73]">
                    {connected ? settings?.listingCount ?? 0 : '—'}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Listings</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center">
                  <p className="text-sm font-bold leading-none text-[#0f3f73]">
                    {connected && settings?.lastSync ? new Date(settings.lastSync).toLocaleString() : '—'}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Last sync</p>
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-800">
                  User ID{connected ? ' (add another or reconnect)' : ''}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value.replace(/\D/g, ''))}
                  placeholder="Input User ID"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-[#FF5A5F]/25"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Your Airbnb host User ID. After connecting you can add more User IDs and map rooms.
                </span>
              </label>

              {testResult ? (
                <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-950">
                  <p className="font-semibold">Test passed</p>
                  <p className="mt-1 text-xs">
                    User ID: {testResult.userId || userId}
                    {typeof testResult.listingCount === 'number' ? ` · ${testResult.listingCount} listings` : ''}
                  </p>
                </div>
              ) : null}

              {connected ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Primary User ID:</span> {settings?.propertyId || '—'}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">User IDs:</span> {settings?.hostCount ?? 0}
                    <span className="mx-1">·</span>
                    <span className="font-semibold">Listings:</span> {settings?.listingCount ?? 0}
                  </p>
                  {settings?.lastError ? <p className="mt-1 text-rose-700">Last error: {settings.lastError}</p> : null}
                  <button
                    type="button"
                    onClick={() => navigate('/ota-connect/airbnb/accommodations')}
                    className="mt-3 inline-flex rounded-xl border border-[#FF5A5F]/40 bg-white px-3 py-2 text-xs font-bold text-[#FF5A5F] hover:bg-[#fff5f5]"
                  >
                    Manage User IDs & mappings
                  </button>
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
                  {busy === 'connect' ? 'Connecting…' : connected ? 'Add / update User ID' : 'Connect Airbnb'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AirbnbConnectPage
