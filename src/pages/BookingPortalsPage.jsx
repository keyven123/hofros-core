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

const PORTAL_DISPLAY_ORDER = [
  'direct_website',
  'ticketoc',
  'airbnb',
  'agoda',
  'tripadvisor',
  'booking_com',
]

const PORTAL_BRANDS = {
  direct_website: {
    tint: 'border-[#d7e4f7] bg-white',
    accent: '#0f3f73',
    bannerColor: '#0f3f73',
    logoBg: 'bg-white/15',
    logoSrc: null,
    monogram: 'DW',
  },
  ticketoc: {
    tint: 'border-[#e8e8e8] bg-white',
    accent: '#f5c518',
    bannerColor: '#ffffff',
    logoBg: 'bg-white',
    logoSrc: '/portal-logos/ticketoc.png?v=3',
    monogram: 'TI',
    logoFit: 'contain',
  },
  airbnb: {
    tint: 'border-[#ffd4d6] bg-white',
    accent: '#FF5A5F',
    bannerColor: '#FF5A5F',
    logoBg: 'bg-[#FF5A5F]',
    logoSrc: '/portal-logos/airbnb.svg?v=3',
    monogram: 'AB',
    logoFit: 'contain',
  },
  agoda: {
    tint: 'border-[#e2e8f0] bg-white',
    accent: '#334155',
    bannerColor: '#ffffff',
    logoBg: 'bg-white',
    logoSrc: '/portal-logos/agoda.png?v=2',
    monogram: 'AG',
    logoFit: 'contain',
  },
  tripadvisor: {
    tint: 'border-[#cfe4ff] bg-white',
    accent: '#287DFA',
    bannerColor: '#ffffff',
    logoBg: 'bg-white',
    logoSrc: '/portal-logos/trip-com.png?v=2',
    monogram: 'TR',
    logoFit: 'contain',
  },
  booking_com: {
    tint: 'border-[#c9daf8] bg-white',
    accent: '#003B95',
    bannerColor: '#003B95',
    logoBg: 'bg-[#003B95]',
    logoSrc: '/portal-logos/booking-com.svg?v=3',
    monogram: 'BO',
    logoFit: 'contain',
  },
}

function portalBrand(portalId) {
  return PORTAL_BRANDS[portalId] || {
    tint: 'border-slate-200 bg-white',
    accent: '#0f3f73',
    bannerColor: '#0f172a',
    logoBg: 'bg-white/10',
    logoSrc: null,
    monogram: 'CH',
  }
}

function PortalBrandBanner({ portalId, name }) {
  const brand = portalBrand(portalId)
  const fitClass = brand.logoFit === 'contain' ? 'object-contain object-center px-4 py-2' : 'object-cover object-center'
  const isLightBanner = brand.bannerColor === '#ffffff' || brand.bannerColor === '#FFFFFF'

  return (
    <div
      className={`relative h-14 w-full shrink-0 overflow-hidden ${isLightBanner ? 'border-b border-slate-100' : ''}`}
      style={{ backgroundColor: brand.bannerColor }}
      aria-hidden="true"
    >
      {brand.logoSrc ? (
        <img
          src={brand.logoSrc}
          alt=""
          className={`absolute inset-0 h-full w-full ${fitClass}`}
          style={{ backgroundColor: brand.bannerColor }}
        />
      ) : (
        <div className="relative z-[1] flex h-full w-full items-center justify-center px-4">
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">Hofros</p>
            <p className="text-sm font-black tracking-tight text-white">{name || 'Direct Website'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function PortalBrandMark({ portalId, name }) {
  const brand = portalBrand(portalId)

  return (
    <div
      className={`h-9 w-14 shrink-0 overflow-hidden rounded-lg border border-black/5 shadow-sm ${brand.logoBg || 'bg-white'}`}
      aria-hidden="true"
    >
      {brand.logoSrc ? (
        <img
          src={brand.logoSrc}
          alt=""
          className="h-full w-full object-contain p-1"
          style={{ backgroundColor: brand.bannerColor }}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[10px] font-black tracking-wide text-slate-600">
          {brand.monogram || name?.slice(0, 2)?.toUpperCase() || 'CH'}
        </span>
      )}
    </div>
  )
}

function PortalStatus({ status }) {
  if (status === 'Connected') {
    return (
      <>
        <CheckIcon className="h-4 w-4 text-emerald-600" />
        <span className="text-emerald-700">Connected</span>
      </>
    )
  }
  if (status === 'Sync issue') {
    return (
      <>
        <WarningIcon className="h-4 w-4 text-amber-600" />
        <span className="text-amber-700">Sync issue</span>
      </>
    )
  }
  if (status === 'Testing') {
    return (
      <>
        <BeakerIcon className="h-4 w-4 text-blue-600" />
        <span className="text-blue-800">Testing</span>
      </>
    )
  }
  if (status === 'Live and connected') {
    return (
      <>
        <CheckIcon className="h-4 w-4 text-emerald-600" />
        <span className="text-emerald-700">Live and connected</span>
      </>
    )
  }
  return (
    <>
      <XSmallIcon className="h-4 w-4 text-slate-400" />
      <span className="text-slate-500">Not connected</span>
    </>
  )
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

function portalKey(channel) {
  return channel?.id ?? channel?.uuid
}

function sortChannels(list) {
  return [...list].sort((a, b) => {
    const ai = PORTAL_DISPLAY_ORDER.indexOf(portalKey(a))
    const bi = PORTAL_DISPLAY_ORDER.indexOf(portalKey(b))
    const ao = ai === -1 ? PORTAL_DISPLAY_ORDER.length : ai
    const bo = bi === -1 ? PORTAL_DISPLAY_ORDER.length : bi
    return ao - bo
  })
}

function disconnectedPrimaryLabel(channel) {
  return channel.disconnectedActionLabel || 'Connect'
}

function isDirectPortalDisconnected(channel) {
  const kind = channel.disconnectedActionKind
  return kind === 'build_direct_website' || kind === 'open_website_builder'
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
      setChannels(sortChannels(Array.isArray(data.channels) ? data.channels : []))
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
    const id = portalKey(channel)
    setBusyId(id)
    setBanner(null)
    try {
      await apiFetch(`/v1/booking-portals/${id}/active`, {
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
    const id = portalKey(channel)
    setBusyId(id)
    setBanner(null)
    try {
      const data = await apiFetch(`/v1/booking-portals/${id}/sync`, { method: 'POST', body: '{}' })
      setBanner({ type: 'ok', text: data?.message || 'Sync started.' })
      await load()
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Sync failed.' })
    } finally {
      setBusyId(null)
    }
  }

  async function handleConnect(channel) {
    const id = portalKey(channel)
    setBusyId(id)
    setBanner(null)
    try {
      const data = await apiFetch(`/v1/booking-portals/${id}/connect`, { method: 'POST', body: '{}' })
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
    const kind = channel.disconnectedActionKind
    if (kind === 'build_direct_website' || kind === 'open_website_builder') {
      setAddOpen(false)
      navigate('/direct-website-builder')
      return
    }
    if (kind === 'open_ticketoc_connect' || portalKey(channel) === 'ticketoc') {
      setAddOpen(false)
      navigate('/ticketoc-connect')
      return
    }
    if (kind === 'open_airbnb_connect' || portalKey(channel) === 'airbnb') {
      setAddOpen(false)
      navigate('/airbnb-connect')
      return
    }
    if (kind === 'open_ota_connect') {
      setAddOpen(false)
      navigate(`/ota-connect/${portalKey(channel)}`)
      return
    }
    void handleConnect(channel)
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-amber-100/80 bg-gradient-to-r from-white via-[#fffbeb] to-[#f0f7ff] px-4 py-3 md:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-[#0f3f73] md:text-2xl">Booking Portals</h1>
            <p className="mt-0.5 max-w-xl truncate text-xs text-slate-600 sm:text-sm">
              Manage your channel connections and sync settings across OTAs and your direct site.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddChannel}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700"
          >
            <PlusIcon />
            Add Channel
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 md:px-6">
        {banner && (
          <div
            className={`mb-2 shrink-0 rounded-xl border px-3 py-2 text-sm font-medium ${
              banner.type === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {banner.text}
          </div>
        )}

        {error && (
          <div className="mb-2 shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading channels…</p>
        ) : (
          <>
            <div className="grid shrink-0 gap-2.5 sm:grid-cols-3">
              <article className="rounded-xl border border-blue-100 bg-white px-3 py-2.5 shadow-sm shadow-blue-900/5">
                <p className="text-2xl font-black leading-none text-emerald-600">{summary.connectedChannels}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Connected channels</p>
              </article>
              <article className="rounded-xl border border-amber-100 bg-white px-3 py-2.5 shadow-sm shadow-amber-900/5">
                <p className="text-2xl font-black leading-none text-blue-600">{summary.totalListings}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total listings</p>
              </article>
              <article className="rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-2xl font-black leading-none text-amber-600">{summary.syncIssues}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sync issues</p>
              </article>
            </div>

            <div className="mt-3 grid min-h-0 flex-1 content-start grid-cols-1 gap-3 overflow-auto sm:grid-cols-2 xl:grid-cols-3">
              {channels.map((ch) => {
                const disconnected = !ch.isConnected
                const pk = portalKey(ch)
                const busy = busyId === pk
                const brand = portalBrand(pk)

                return (
                  <article
                    key={pk}
                    className={`group flex flex-col overflow-hidden rounded-xl border shadow-[0_6px_18px_rgba(15,23,42,0.045)] transition duration-200 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${brand.tint}`}
                  >
                    <PortalBrandBanner portalId={pk} name={ch.name} />

                    <div className="flex flex-col gap-2.5 p-3">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black tracking-tight text-[#0f3f73]">{ch.name}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold">
                            <PortalStatus status={ch.status} />
                          </div>
                        </div>
                        {!disconnected ? (
                          <Toggle
                            checked={ch.isActive}
                            disabled={busy}
                            onChange={() => handleToggleActive(ch)}
                            label={`${ch.name} active`}
                          />
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2 py-1.5 text-center">
                          <p className="text-sm font-black leading-none text-[#0f3f73]">{disconnected ? '—' : ch.listingCount}</p>
                          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Listings</p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2 py-1.5 text-center">
                          <p className="text-[11px] font-bold leading-none text-[#0f3f73]">
                            {disconnected ? '—' : formatRelativeTime(ch.lastSync)}
                          </p>
                          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Last sync</p>
                        </div>
                      </div>

                      <div>
                        {disconnected ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDisconnectedPrimary(ch)}
                            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-[1.03] disabled:opacity-60 ${
                              isDirectPortalDisconnected(ch)
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {isDirectPortalDisconnected(ch) ? (
                              <BuildWebsiteIcon className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="text-center leading-snug">{disconnectedPrimaryLabel(ch)}</span>
                          </button>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleSync(ch)}
                              className="inline-flex min-h-8 min-w-[6.5rem] flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-[11px] font-bold text-[#0f3f73] shadow-sm transition hover:border-blue-200 hover:bg-blue-50/60 disabled:opacity-60"
                            >
                              <RefreshIcon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                              Sync now
                            </button>
                            {pk === 'direct_website' && ch.guestPortalLive ? (
                              <a
                                href={typeof ch.visitUrl === 'string' && ch.visitUrl ? ch.visitUrl : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex min-h-8 min-w-[6.5rem] flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white px-2 py-1.5 text-[11px] font-bold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:from-emerald-100/80 hover:to-white ${
                                  typeof ch.visitUrl === 'string' && ch.visitUrl ? '' : 'pointer-events-none opacity-60'
                                }`}
                                aria-label={`Visit ${ch.name}`}
                              >
                                <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                Visit site
                              </a>
                            ) : null}
                            {pk === 'direct_website' && ch.guestPortalLive ? (
                              <button
                                type="button"
                                onClick={() => navigate('/direct-website-builder')}
                                className="inline-flex min-h-8 min-w-[6.5rem] flex-1 items-center justify-center gap-1 rounded-lg border border-blue-200 bg-gradient-to-b from-blue-50 to-white px-2 py-1.5 text-[11px] font-bold text-[#0f3f73] shadow-sm transition hover:border-blue-300 hover:from-blue-100/80 hover:to-white"
                              >
                                <BuildWebsiteIcon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                                Website Builder
                              </button>
                            ) : null}
                            {pk === 'airbnb' ? (
                              <button
                                type="button"
                                onClick={() => navigate('/ota-connect/airbnb/accommodations')}
                                className="inline-flex min-h-8 min-w-[6.5rem] flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 bg-gradient-to-b from-rose-50 to-white px-2 py-1.5 text-[11px] font-bold text-rose-800 shadow-sm transition hover:border-rose-300 hover:from-rose-100/80 hover:to-white"
                              >
                                Map rooms
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                if (pk === 'ticketoc') {
                                  navigate('/ticketoc-connect')
                                  return
                                }
                                if (pk === 'airbnb') {
                                  navigate('/airbnb-connect')
                                  return
                                }
                                if (['booking_com', 'agoda', 'tripadvisor'].includes(pk)) {
                                  navigate(`/ota-connect/${pk}`)
                                  return
                                }
                                if (pk === 'direct_website') {
                                  navigate('/direct-website-builder')
                                  return
                                }
                                setSettingsChannel(ch)
                              }}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-amber-200 hover:bg-amber-50/50 hover:text-[#0f3f73]"
                              aria-label={`${ch.name} settings`}
                            >
                              <GearIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
                  key={portalKey(ch)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#fbfdff] px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PortalBrandMark portalId={portalKey(ch)} name={ch.name} />
                    <span className="truncate text-sm font-bold text-[#0f3f73]">{ch.name}</span>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === portalKey(ch)}
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
