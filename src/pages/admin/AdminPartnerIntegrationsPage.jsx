import { useCallback, useEffect, useState } from 'react'
import { AdminHeading, AdminPanel } from '../../components/admin/adminUi'
import { adminFetch } from '../../utils/adminApi'

const STAY_STATUS = {
  missing: { label: 'Key not set', className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100' },
  saved: { label: 'Key saved', className: 'bg-sky-50 text-sky-800 ring-1 ring-sky-100' },
  ready: { label: 'Waiting on Ticketoc', className: 'bg-sky-50 text-sky-800 ring-1 ring-sky-100' },
  connected: { label: 'Stay connected', className: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100' },
  error: { label: 'Connection failed', className: 'bg-rose-50 text-rose-800 ring-1 ring-rose-100' },
}

const PORTAL_HINTS = {
  ticketoc: 'Merchants connect with Ticketoc email/password against this API base URL. Stay uses the partner key below.',
  booking_com: 'Merchants enter Hotel ID + Connectivity client ID/secret. This is the Booking.com API base URL.',
  airbnb: 'Merchants connect with Airbnb User ID only, then map captured listings. This is the Airbnb API base URL.',
  agoda: 'Merchants enter Hotel ID, Site ID, and API key. This is the Agoda YCS / partner API base URL.',
  tripadvisor: 'Merchants enter Hotel ID, AID, SID, and API key. This is the Trip.com / Ctrip API base URL.',
}

function AdminPartnerIntegrationsPage() {
  const [rows, setRows] = useState([])
  const [draft, setDraft] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const hydrate = useCallback((integrations) => {
    const nextDraft = {}
    for (const item of integrations) {
      nextDraft[item.portalKey] = {
        apiBaseUrl: item.apiBaseUrl || '',
        isEnabled: Boolean(item.isEnabled),
        stayPartnerKey: '',
      }
    }
    setRows(integrations)
    setDraft(nextDraft)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminFetch('/v1/admin/partner-portals')
      hydrate(Array.isArray(data.integrations) ? data.integrations : [])
    } catch (requestError) {
      setError(requestError?.message || 'Could not load partner integrations.')
    } finally {
      setLoading(false)
    }
  }, [hydrate])

  useEffect(() => {
    void load()
  }, [load])

  function updateDraft(portalKey, patch) {
    setDraft((prev) => ({
      ...prev,
        [portalKey]: {
        ...(prev[portalKey] || { apiBaseUrl: '', isEnabled: true, stayPartnerKey: '' }),
        ...patch,
      },
    }))
  }

  async function saveAll() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        integrations: rows.map((row) => {
          const values = draft[row.portalKey] || {}
          const item = {
            portalKey: row.portalKey,
            apiBaseUrl: (values.apiBaseUrl || '').trim() || null,
            isEnabled: Boolean(values.isEnabled),
          }
          const stayKey = (values.stayPartnerKey || '').trim()
          if (row.portalKey === 'ticketoc' && stayKey) {
            item.stayPartnerKey = stayKey
          }
          return item
        }),
      }
      const data = await adminFetch('/v1/admin/partner-portals', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      hydrate(Array.isArray(data.integrations) ? data.integrations : [])
      setNotice(data?.message || 'Partner portal API settings saved.')
    } catch (requestError) {
      setError(requestError?.message || 'Could not save partner integrations.')
    } finally {
      setBusy(false)
    }
  }

  async function connectStay() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const values = draft.ticketoc || {}
      const data = await adminFetch('/v1/admin/partner-portals/ticketoc/stay/connect', {
        method: 'POST',
        body: JSON.stringify({
          apiBaseUrl: (values.apiBaseUrl || '').trim() || null,
          stayPartnerKey: (values.stayPartnerKey || '').trim() || null,
        }),
      })
      hydrate(Array.isArray(data.integrations) ? data.integrations : [])
      setNotice(data?.message || 'Ticketoc Stay connection updated.')
    } catch (requestError) {
      setError(requestError?.message || 'Could not connect Ticketoc Stay.')
      const integration = requestError?.body?.integration
      if (integration) {
        setRows((current) => current.map((row) => (
          row.portalKey === 'ticketoc' ? { ...row, ...integration } : row
        )))
        setDraft((prev) => ({
          ...prev,
          ticketoc: { ...(prev.ticketoc || {}), stayPartnerKey: '' },
        }))
      }
    } finally {
      setBusy(false)
    }
  }

  async function copyInboundUrl(url) {
    try {
      await navigator.clipboard.writeText(url)
      setNotice('Hofros URL copied. Paste it into Ticketoc as the API base URL.')
      setError('')
    } catch {
      setError('Could not copy the Hofros URL.')
    }
  }

  return (
    <>
      <AdminHeading
        kicker="Access"
        title="Partner integrations"
        description="Configure partner booking portal API endpoints used by merchant channel connections."
      >
        <button
          type="button"
          disabled={busy || loading}
          onClick={saveAll}
          className="rounded-full bg-[#0b1020] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a2238] disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </AdminHeading>

      {notice ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading partner integrations…</p>
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => {
            const values = draft[row.portalKey] || { apiBaseUrl: '', isEnabled: true, stayPartnerKey: '' }
            const stayStatus = STAY_STATUS[row.stayStatus] || STAY_STATUS.missing
            return (
              <AdminPanel key={row.portalKey} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-[#0b1020]">{row.name}</h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          values.isEnabled
                            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                        }`}
                      >
                        {values.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          values.apiBaseUrl
                            ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-100'
                            : 'bg-amber-50 text-amber-800 ring-1 ring-amber-100'
                        }`}
                      >
                        {values.apiBaseUrl ? 'API set' : 'API missing'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{PORTAL_HINTS[row.portalKey] || 'Partner API endpoint.'}</p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(values.isEnabled)}
                      onChange={(event) => updateDraft(row.portalKey, { isEnabled: event.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-[#0b1020] focus:ring-[#c6a15b]"
                    />
                    Enable for merchants
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    API base URL
                  </span>
                  <input
                    value={values.apiBaseUrl}
                    onChange={(event) => updateDraft(row.portalKey, { apiBaseUrl: event.target.value })}
                    placeholder={
                      row.portalKey === 'ticketoc'
                        ? 'http://127.0.0.1:8000/api/v1'
                        : 'https://partner-api.example.com'
                    }
                    className="w-full rounded-xl border border-[#e8e4dc] bg-[#fcfbf8] px-3 py-2.5 font-mono text-sm text-[#0b1020] outline-none focus:ring-2 focus:ring-[#c6a15b]/40"
                  />
                </label>

                {row.portalKey === 'ticketoc' ? (
                  <div className="mt-5 rounded-2xl border border-[#e8e4dc] bg-[#fcfbf8] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[#0b1020]">Ticketoc Stay</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Paste the partner key from Ticketoc Settings → Integration → Stay. Ticketoc then reads Hofros rooms and sends the reservation back.
                        </p>
                      </div>
                      <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${stayStatus.className}`}>
                        {stayStatus.label}
                      </span>
                    </div>

                    <label className="mt-4 block">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Partner key
                      </span>
                      <input
                        type="password"
                        autoComplete="off"
                        value={values.stayPartnerKey}
                        onChange={(event) => updateDraft('ticketoc', { stayPartnerKey: event.target.value })}
                        placeholder={row.stayPartnerKeySet ? `Saved (${row.stayPartnerKeyPrefix || 'key'}…). Leave blank to keep it.` : 'Paste the key from Ticketoc'}
                        className="w-full rounded-xl border border-[#e8e4dc] bg-white px-3 py-2.5 font-mono text-sm text-[#0b1020] outline-none focus:ring-2 focus:ring-[#c6a15b]/40"
                      />
                    </label>

                    <div className="mt-4">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Hofros URL for Ticketoc
                      </span>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          readOnly
                          value={row.stayInboundUrl || ''}
                          className="w-full rounded-xl border border-[#e8e4dc] bg-white px-3 py-2.5 font-mono text-sm text-[#0b1020]"
                        />
                        <button
                          type="button"
                          onClick={() => copyInboundUrl(row.stayInboundUrl || '')}
                          className="rounded-full border border-[#e8e4dc] bg-white px-4 py-2 text-sm font-semibold text-[#0b1020]"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Paste this into Ticketoc as the API base URL, then generate the partner key there.</p>
                    </div>

                    {row.stayLastError ? (
                      <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{row.stayLastError}</p>
                    ) : null}

                    <button
                      type="button"
                      disabled={busy || (!values.stayPartnerKey.trim() && !row.stayPartnerKeySet) || !values.apiBaseUrl.trim()}
                      onClick={connectStay}
                      className="mt-4 rounded-full bg-[#0b1020] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a2238] disabled:opacity-60"
                    >
                      {busy ? 'Connecting…' : 'Connect Stay'}
                    </button>
                  </div>
                ) : null}
              </AdminPanel>
            )
          })}
        </div>
      )}
    </>
  )
}

export default AdminPartnerIntegrationsPage
