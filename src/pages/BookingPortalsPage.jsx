import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'

function formatRelativeTime(iso) {
  if (!iso) {
    return '—'
  }
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) {
    return '—'
  }
  const sec = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (sec < 45) {
    return 'Just now'
  }
  const min = Math.round(sec / 60)
  if (min < 60) {
    return `${min} min ago`
  }
  const hr = Math.round(min / 60)
  if (hr < 48) {
    return `${hr} hr ago`
  }
  const day = Math.round(hr / 24)
  return `${day} day${day === 1 ? '' : 's'} ago`
}

const TINT_STYLES = {
  rose: 'border-rose-100 bg-gradient-to-br from-rose-50/90 to-white',
  blue: 'border-sky-100 bg-gradient-to-br from-sky-50/90 to-white',
  yellow: 'border-amber-100 bg-gradient-to-br from-amber-50/95 via-yellow-50/80 to-white',
  slate: 'border-slate-200 bg-gradient-to-br from-slate-100/90 to-slate-50/80',
  emerald: 'border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white',
  direct: 'border-blue-200 bg-gradient-to-br from-[#fffbeb] via-white to-sky-50/95',
}

function portalMonogram(name) {
  const parts = name.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarningIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinejoin="round" />
    </svg>
  )
}

function BeakerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4.5 3h15" strokeLinecap="round" />
      <path d="M6 3v11a4.5 4.5 0 0 0 9 0V3" strokeLinejoin="round" />
      <path d="M6 14h12" strokeLinecap="round" />
    </svg>
  )
}

function XSmallIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}

function LinkIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
    </svg>
  )
}

function BuildWebsiteIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="2" strokeLinejoin="round" />
      <path d="M7 8h4M7 12h10M7 16h6" strokeLinecap="round" />
      <path d="M17 18v3M15 19.5h4" strokeLinecap="round" />
    </svg>
  )
}

function RefreshIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" />
      <path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" strokeLinecap="round" />
      <path d="M21 21v-5h-5" strokeLinecap="round" />
    </svg>
  )
}

function GearIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  )
}

function ExternalLinkIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 4h6v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14 20 4" strokeLinecap="round" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" strokeLinecap="round" />
    </svg>
  )
}

function Toggle({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
        checked ? 'border-blue-500 bg-blue-500' : 'border-slate-200 bg-slate-200'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
          checked ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_24px_60px_rgba(15,63,115,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#fffef5] to-white px-4 py-3">
          <h2 className="text-base font-black text-[#0f3f73]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <XSmallIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[min(70vh,520px)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

function disconnectedPrimaryLabel(channel) {
  return channel.disconnectedActionLabel || (channel.id === 'direct_website' ? 'Build a direct website' : 'Connect')
}

function isDirectPortalDisconnected(channel) {
  return channel.id === 'direct_website' && !channel.isConnected
}

function BookingPortalsPage() {
  const navigate = useNavigate()
  const [channels, setChannels] = useState([])
  const [summary, setSummary] = useState({ connectedChannels: 0, totalListings: 0, syncIssues: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [available, setAvailable] = useState([])
  const [availableLoading, setAvailableLoading] = useState(false)
  const [settingsChannel, setSettingsChannel] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiFetch('/v1/booking-portals')
      if (!mountedRef.current) {
        return
      }
      setChannels(Array.isArray(data.channels) ? data.channels : [])
      setSummary({
        connectedChannels: data.summary?.connectedChannels ?? 0,
        totalListings: data.summary?.totalListings ?? 0,
        syncIssues: data.summary?.syncIssues ?? 0,
      })
    } catch (e) {
      if (!mountedRef.current) {
        return
      }
      setError(e instanceof Error ? e.message : 'Failed to load booking portals.')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timerId)
  }, [load])

  async function openAddChannel() {
    setAddOpen(true)
    setAvailableLoading(true)
    setAvailable([])
    try {
      const data = await apiFetch('/v1/booking-portals/available')
      setAvailable(Array.isArray(data.channels) ? data.channels : [])
    } catch {
      setAvailable([])
    } finally {
      setAvailableLoading(false)
    }
  }

  async function handleToggleActive(channel) {
    setBusyId(channel.id)
    setBanner(null)
    try {
      await apiFetch(`/v1/booking-portals/${channel.id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !channel.isActive }),
      })
      await load()
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Could not update channel.' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleSync(channel) {
    setBusyId(channel.id)
    setBanner(null)
    try {
      const data = await apiFetch(`/v1/booking-portals/${channel.id}/sync`, { method: 'POST', body: '{}' })
      setBanner({ type: 'ok', text: data?.message || 'Sync started.' })
      await load()
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Sync failed.' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleConnect(channel) {
    setBusyId(channel.id)
    setBanner(null)
    try {
      const data = await apiFetch(`/v1/booking-portals/${channel.id}/connect`, { method: 'POST', body: '{}' })
      setBanner({ type: 'ok', text: data?.message || 'Connected.' })
      setAddOpen(false)
      await load()
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Could not connect.' })
    } finally {
      setBusyId(null)
    }
  }

  function handleDisconnectedPrimary(channel) {
    if (channel.id === 'direct_website' && !channel.isConnected) {
      setAddOpen(false)
      navigate('/direct-website-builder')
      return
    }
    void handleConnect(channel)
  }

  return (
    <div className="min-h-full bg-white">
      <div className="border-b border-amber-100/80 bg-gradient-to-r from-white via-[#fffbeb] to-[#f0f7ff] px-4 py-6 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0f3f73] md:text-3xl">Booking Portals</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Manage your channel connections and sync settings across OTAs and your direct site.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddChannel}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700"
          >
            <PlusIcon />
            Add Channel
          </button>
        </div>
      </div>

      <div className="px-4 py-6 md:px-8">
        {banner && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              banner.type === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {banner.text}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading channels…</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-900/5">
                <p className="text-3xl font-black text-emerald-600">{summary.connectedChannels}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Connected channels</p>
              </article>
              <article className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm shadow-amber-900/5">
                <p className="text-3xl font-black text-blue-600">{summary.totalListings}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Total listings</p>
              </article>
              <article className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm">
                <p className="text-3xl font-black text-amber-600">{summary.syncIssues}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Sync issues</p>
              </article>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {channels.map((ch) => {
                const tint = TINT_STYLES[ch.tint] || TINT_STYLES.slate
                const disconnected = !ch.isConnected
                const busy = busyId === ch.id

                return (
                  <article
                    key={ch.id}
                    className={`flex flex-col rounded-2xl border p-4 shadow-sm ${tint} ${
                      disconnected ? 'opacity-95' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                          disconnected ? 'bg-slate-200 text-slate-600' : 'bg-white text-[#0f3f73] shadow-sm'
                        }`}
                      >
                        {portalMonogram(ch.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-black text-[#0f3f73]">{ch.name}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
                          {ch.status === 'Connected' && (
                            <>
                              <CheckIcon className="h-4 w-4 text-emerald-600" />
                              <span className="text-emerald-700">Connected</span>
                            </>
                          )}
                          {ch.status === 'Sync issue' && (
                            <>
                              <WarningIcon className="h-4 w-4 text-amber-600" />
                              <span className="text-amber-700">Sync issue</span>
                            </>
                          )}
                          {ch.status === 'Not connected' && (
                            <>
                              <XSmallIcon className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-500">Not connected</span>
                            </>
                          )}
                          {ch.status === 'Testing' && (
                            <>
                              <BeakerIcon className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-800">Testing</span>
                            </>
                          )}
                          {ch.status === 'Live and connected' && (
                            <>
                              <CheckIcon className="h-4 w-4 text-emerald-600" />
                              <span className="text-emerald-700">Live and connected</span>
                            </>
                          )}
                        </div>
                      </div>
                      {!disconnected ? (
                        <Toggle
                          checked={ch.isActive}
                          disabled={busy}
                          onChange={() => handleToggleActive(ch)}
                          label={`${ch.name} active`}
                        />
                      ) : (
                        <span className="w-12 shrink-0" aria-hidden="true" />
                      )}
                    </div>

                    {disconnected ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDisconnectedPrimary(ch)}
                        className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-60 ${
                          isDirectPortalDisconnected(ch)
                            ? 'border border-amber-200/80 bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm shadow-blue-900/15 hover:from-blue-700 hover:to-blue-800'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isDirectPortalDisconnected(ch) ? (
                          <BuildWebsiteIcon className="h-4 w-4 shrink-0" />
                        ) : (
                          <LinkIcon className="h-4 w-4 shrink-0" />
                        )}
                        <span className="text-center leading-snug">{disconnectedPrimaryLabel(ch)}</span>
                      </button>
                    ) : (
                      <>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-center shadow-sm">
                            <p className="text-lg font-black text-[#0f3f73]">{ch.listingCount}</p>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Listings</p>
                          </div>
                          <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-center shadow-sm">
                            <p className="text-sm font-bold text-[#0f3f73]">{formatRelativeTime(ch.lastSync)}</p>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Last sync</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleSync(ch)}
                            className="inline-flex min-h-10 min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-[#0f3f73] shadow-sm transition hover:border-blue-200 hover:bg-blue-50/60 disabled:opacity-60"
                          >
                            <RefreshIcon className="h-4 w-4 shrink-0 text-blue-600" />
                            Sync now
                          </button>
                          {ch.id === 'direct_website' && ch.guestPortalLive ? (
                            <a
                              href={typeof ch.visitUrl === 'string' && ch.visitUrl ? ch.visitUrl : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex min-h-10 min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white py-2.5 text-sm font-bold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:from-emerald-100/80 hover:to-white ${
                                typeof ch.visitUrl === 'string' && ch.visitUrl ? '' : 'pointer-events-none opacity-60'
                              }`}
                              aria-label={`Visit ${ch.name}`}
                            >
                              <ExternalLinkIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                              Visit site
                            </a>
                          ) : null}
                          {ch.id === 'direct_website' && ch.guestPortalLive ? (
                            <button
                              type="button"
                              onClick={() => navigate('/direct-website-builder')}
                              className="inline-flex min-h-10 min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white py-2.5 text-sm font-bold text-[#0f3f73] shadow-sm transition hover:border-blue-300 hover:from-blue-100/80 hover:to-white"
                            >
                              <BuildWebsiteIcon className="h-4 w-4 shrink-0 text-blue-600" />
                              Website Builder
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setSettingsChannel(ch)}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-amber-200 hover:bg-amber-50/50 hover:text-[#0f3f73]"
                            aria-label={`${ch.name} settings`}
                          >
                            <GearIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>

      {addOpen && (
        <Modal title="Add a channel" onClose={() => setAddOpen(false)}>
          {availableLoading ? (
            <p className="text-sm text-slate-500">Loading available integrations…</p>
          ) : available.length === 0 ? (
            <p className="text-sm text-slate-600">Every supported portal is already connected.</p>
          ) : (
            <ul className="space-y-2">
              {available.map((ch) => (
                <li
                  key={ch.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#fbfdff] px-3 py-2"
                >
                  <span className="text-sm font-bold text-[#0f3f73]">{ch.name}</span>
                  <button
                    type="button"
                    disabled={busyId === ch.id}
                    onClick={() => handleDisconnectedPrimary(ch)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {disconnectedPrimaryLabel(ch)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {settingsChannel && (
        <Modal title={`${settingsChannel.name} settings`} onClose={() => setSettingsChannel(null)}>
          <p className="text-sm text-slate-600">
            OAuth, API keys, and mapping rules will be configured here. This preview stores connection state on the
            server so toggles and sync actions persist for your account.
          </p>
          <button
            type="button"
            onClick={() => setSettingsChannel(null)}
            className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  )
}

export default BookingPortalsPage
