import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../utils/api'

const PORTAL_LOGOS = {
  booking_com: '/portal-logos/booking-com.svg?v=3',
  airbnb: '/portal-logos/airbnb.svg?v=3',
  agoda: '/portal-logos/agoda.png?v=2',
  tripadvisor: '/portal-logos/trip-com.png?v=2',
}

const PORTAL_BANNER = {
  booking_com: '#003B95',
  airbnb: '#FF5A5F',
  agoda: '#ffffff',
  tripadvisor: '#ffffff',
}

function OtaConnectPage() {
  const { portalKey } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState({})
  const [showSecrets, setShowSecrets] = useState({})
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [testResult, setTestResult] = useState(null)

  const fields = settings?.fields || []
  const apiConfigured = settings?.apiConfigured !== false
  const connected = Boolean(settings?.isConnected)
  const logoSrc = PORTAL_LOGOS[portalKey]
  const bannerColor = PORTAL_BANNER[portalKey] || '#0f3f73'
  const lightBanner = bannerColor === '#ffffff'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch(`/v1/booking-portals/${portalKey}/ota/settings`)
      const next = data?.settings ?? null
      setSettings(next)
      const nextForm = {}
      for (const field of next?.fields || []) {
        const valueMeta = next?.values?.[field.key]
        nextForm[field.key] = field.secret ? '' : valueMeta?.value || ''
      }
      setForm(nextForm)
    } catch (requestError) {
      setError(requestError?.message || 'Could not load OTA settings.')
    } finally {
      setLoading(false)
    }
  }, [portalKey])

  useEffect(() => {
    if (portalKey === 'airbnb') {
      navigate('/airbnb-connect', { replace: true })
      return
    }
    void load()
  }, [load, navigate, portalKey])

  const canSubmit = useMemo(() => {
    if (!apiConfigured || !fields.length) return false
    return fields.every((field) => {
      if (!field.required) return true
      if (field.secret && settings?.values?.[field.key]?.hasValue) return true
      return Boolean(String(form[field.key] || '').trim())
    })
  }, [apiConfigured, fields, form, settings])

  function payloadFromForm() {
    const body = {}
    for (const field of fields) {
      const value = String(form[field.key] || '').trim()
      if (value) body[field.key] = value
    }
    return body
  }

  async function testConnection() {
    setBusy('test')
    setError('')
    setNotice('')
    setTestResult(null)
    try {
      const data = await apiFetch(`/v1/booking-portals/${portalKey}/ota/test`, {
        method: 'POST',
        body: JSON.stringify(payloadFromForm()),
      })
      setTestResult(data?.result ?? null)
      setNotice(data?.message || 'Credentials look valid.')
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
      const data = await apiFetch(`/v1/booking-portals/${portalKey}/ota/connect`, {
        method: 'POST',
        body: JSON.stringify(payloadFromForm()),
      })
      setSettings(data?.settings ?? null)
      setNotice(data?.message || 'Connected.')
      const cleared = { ...form }
      for (const field of data?.settings?.fields || fields) {
        if (field.secret) cleared[field.key] = ''
      }
      setForm(cleared)
      if (portalKey === 'airbnb') {
        setTimeout(() => navigate('/ota-connect/airbnb/accommodations'), 500)
        return
      }
      setTimeout(() => navigate('/bookingportals'), 700)
    } catch (requestError) {
      setError(requestError?.message || 'Could not connect this OTA.')
    } finally {
      setBusy('')
    }
  }

  async function disconnect() {
    if (!window.confirm(`Disconnect ${settings?.name || 'this channel'} from Hofros?`)) return
    setBusy('disconnect')
    setError('')
    setNotice('')
    try {
      const data = await apiFetch(`/v1/booking-portals/${portalKey}/ota/disconnect`, { method: 'POST' })
      setSettings(data?.settings ?? null)
      setNotice(data?.message || 'Disconnected.')
      setTestResult(null)
      const cleared = {}
      for (const field of data?.settings?.fields || fields) cleared[field.key] = ''
      setForm(cleared)
    } catch (requestError) {
      setError(requestError?.message || 'Could not disconnect.')
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className={`border-b px-5 py-5 sm:px-6 ${lightBanner ? 'border-slate-100 bg-slate-50' : 'border-transparent'}`}
          style={lightBanner ? undefined : { backgroundColor: bannerColor }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`inline-flex h-12 w-[4.75rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border shadow-sm ${
                lightBanner ? 'border-slate-200 bg-white' : 'border-white/20 bg-white/10'
              }`}
            >
              {logoSrc ? (
                <img src={logoSrc} alt="" className="h-full w-full object-contain p-1.5" />
              ) : (
                <span className={`text-xs font-black ${lightBanner ? 'text-slate-700' : 'text-white'}`}>
                  {(settings?.name || portalKey || 'OTA').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className={`text-2xl font-black ${lightBanner ? 'text-[#0f3f73]' : 'text-white'}`}>
                {settings?.name || 'OTA'} integration
              </h1>
              <p className={`mt-1 text-sm ${lightBanner ? 'text-slate-600' : 'text-white/85'}`}>
                {settings?.description || 'Enter the credentials needed to connect this OTA to Hofros.'}
              </p>
              <p className={`mt-2 text-xs font-semibold ${lightBanner ? 'text-slate-500' : 'text-white/80'}`}>
                {connected ? (
                  <span className={lightBanner ? 'text-emerald-700' : 'text-emerald-100'}>
                    ✓ Connected{settings?.propertyLabel ? ` · ${settings.propertyLabel}` : ''}
                  </span>
                ) : (
                  <span>✕ Not connected</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {loading ? <p className="text-sm text-slate-500">Loading integration settings…</p> : null}
          {notice ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
          ) : null}

          {!loading && !apiConfigured ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              The platform API for {settings?.name || 'this OTA'} is not configured yet. Ask a Hofros admin to set the
              partner API base URL under Partner integrations.
            </p>
          ) : null}

          {!loading
            ? fields.map((field) => {
                const valueMeta = settings?.values?.[field.key]
                const isSecret = Boolean(field.secret)
                const show = Boolean(showSecrets[field.key])
                return (
                  <label key={field.key} className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-800">
                      {field.label}
                      {isSecret && valueMeta?.hasValue ? ' (saved — enter again to replace)' : ''}
                    </span>
                    <div className="relative">
                      <input
                        type={isSecret && !show ? 'password' : 'text'}
                        value={form[field.key] || ''}
                        onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                        placeholder={
                          isSecret && valueMeta?.masked
                            ? valueMeta.masked
                            : field.placeholder || undefined
                        }
                        className={`w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 ${
                          isSecret ? 'pr-16' : ''
                        } ${isSecret ? 'font-mono' : ''}`}
                      />
                      {isSecret ? (
                        <button
                          type="button"
                          onClick={() => setShowSecrets((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600"
                        >
                          {show ? 'Hide' : 'Show'}
                        </button>
                      ) : null}
                    </div>
                    {field.help ? <span className="mt-1 block text-xs text-slate-500">{field.help}</span> : null}
                  </label>
                )
              })
            : null}

          {testResult ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-950">
              <p className="font-semibold">Test passed</p>
              <p className="mt-1 text-xs">
                {testResult.propertyLabel || settings?.name || 'OTA'}
                {typeof testResult.fieldsReceived === 'number' ? ` · ${testResult.fieldsReceived} fields ready` : ''}
              </p>
            </div>
          ) : null}

          {connected ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Property:</span> {settings?.propertyLabel || settings?.propertyId || '—'}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Listings:</span> {settings?.listingCount ?? 0}
                {settings?.lastSync ? ` · Last sync ${new Date(settings.lastSync).toLocaleString()}` : ''}
              </p>
              {settings?.lastError ? <p className="mt-1 text-rose-700">Last error: {settings.lastError}</p> : null}
              {portalKey === 'airbnb' ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/ota-connect/airbnb/accommodations')}
                    className="inline-flex rounded-xl border border-[#FF5A5F]/40 bg-white px-3 py-2 text-xs font-bold text-[#FF5A5F] hover:bg-[#fff5f5]"
                  >
                    Manage User IDs & mappings
                  </button>
                  {typeof settings?.hostCount === 'number' ? (
                    <span className="inline-flex items-center rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                      {settings.hostCount} User ID{settings.hostCount === 1 ? '' : 's'}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {!loading ? (
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
                {busy === 'connect'
                  ? 'Connecting…'
                  : connected && portalKey === 'airbnb'
                    ? 'Add / update User ID'
                    : connected
                      ? 'Reconnect'
                      : `Connect ${settings?.name || 'OTA'}`}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default OtaConnectPage
