import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  )
}

function DirectWebsiteBuilderPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [liveSaving, setLiveSaving] = useState(false)
  const [error, setError] = useState(null)
  const [banner, setBanner] = useState(null)

  const [merchantSlug, setMerchantSlug] = useState('')
  const [merchantName, setMerchantName] = useState('')
  const [headline, setHeadline] = useState('')
  const [message, setMessage] = useState('')
  const [guestPortalLive, setGuestPortalLive] = useState(false)
  const [guestPortalDesignCompleted, setGuestPortalDesignCompleted] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiFetch('/v1/booking-portals/direct-website/settings')
      if (!mountedRef.current) {
        return
      }
      setMerchantSlug(data.merchantSlug ?? '')
      setMerchantName(data.merchantName ?? '')
      setHeadline(
        typeof data.headline === 'string' && data.headline.trim()
          ? data.headline
          : `Book directly with ${data.merchantName || 'us'}`,
      )
      setMessage(
        typeof data.message === 'string' && data.message.trim()
          ? data.message
          : 'Browse available units and complete your reservation securely. No middleman fees on direct bookings.',
      )
      setGuestPortalLive(Boolean(data.guestPortalLive))
      setGuestPortalDesignCompleted(Boolean(data.guestPortalDesignCompleted))
    } catch (e) {
      if (!mountedRef.current) {
        return
      }
      setError(e instanceof Error ? e.message : 'Could not load settings.')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  useEffect(() => {
    const flash = location.state?.flash
    if (typeof flash !== 'string' || !flash.trim()) {
      return undefined
    }
    const timerId = window.setTimeout(() => {
      setBanner({ type: 'ok', text: flash.trim() })
      navigate(location.pathname, { replace: true, state: {} })
    }, 0)
    return () => window.clearTimeout(timerId)
  }, [location.pathname, location.state, navigate])

  const customerUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return merchantSlug ? `/${merchantSlug}/directportal` : ''
    }
    return merchantSlug ? `${window.location.origin}/${merchantSlug}/directportal` : ''
  }, [merchantSlug])

  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(customerUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [customerUrl])

  async function saveDraftContent() {
    setSaving(true)
    setBanner(null)
    try {
      await apiFetch('/v1/booking-portals/direct-website/content', {
        method: 'PATCH',
        body: JSON.stringify({ headline, message }),
      })
      setBanner({ type: 'ok', text: 'Draft saved.' })
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Save failed.' })
    } finally {
      setSaving(false)
    }
  }

  async function setLive(nextLive) {
    setLiveSaving(true)
    setBanner(null)
    try {
      const data = await apiFetch('/v1/booking-portals/direct-website/live', {
        method: 'PATCH',
        body: JSON.stringify({ live: nextLive }),
      })
      setGuestPortalLive(Boolean(nextLive))
      setBanner({ type: 'ok', text: data?.message || (nextLive ? 'Now live.' : 'Now testing.') })
      await load()
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Could not update visibility.' })
    } finally {
      setLiveSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-white">
      <div className="border-b border-blue-100 bg-gradient-to-r from-[#fffbeb] via-white to-[#eff6ff] px-4 py-6 md:px-8">
        <nav className="text-sm font-medium text-slate-500">
          <Link to="/bookingportals" className="text-blue-600 hover:text-blue-800">
            Booking Portals
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-[#0f3f73]">Website builder</span>
        </nav>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0f3f73] md:text-3xl">Direct website builder</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Design your micro-site first, then switch the guest link from testing to live when you are ready for
              customers to book.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/direct-portal-design')}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-black text-[#0f3f73] shadow-sm transition hover:bg-[#fffbeb]"
          >
            <PaletteIcon />
            Design micro-site
          </button>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 md:px-8">
        {banner && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              banner.type === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {banner.text}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wide text-amber-700">Guest link visibility</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="font-semibold text-[#0f3f73]">Testing</span> — only you can preview.{' '}
                    <span className="font-semibold text-[#0f3f73]">Live</span> — customers can open the public URL.
                  </p>
                </div>
                <div
                  className={`inline-flex rounded-xl border p-1 ${
                    guestPortalLive ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-[#fffbeb]/80'
                  }`}
                >
                  <button
                    type="button"
                    disabled={liveSaving || guestPortalLive === false}
                    onClick={() => setLive(false)}
                    className={`rounded-lg px-4 py-2 text-sm font-black transition ${
                      !guestPortalLive ? 'bg-white text-[#0f3f73] shadow-sm' : 'text-slate-500 hover:text-[#0f3f73]'
                    }`}
                  >
                    Testing
                  </button>
                  <button
                    type="button"
                    disabled={liveSaving || !guestPortalDesignCompleted || guestPortalLive}
                    onClick={() => setLive(true)}
                    className={`rounded-lg px-4 py-2 text-sm font-black transition ${
                      guestPortalLive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-[#0f3f73]'
                    } ${!guestPortalDesignCompleted ? 'cursor-not-allowed opacity-50' : ''}`}
                    title={
                      guestPortalDesignCompleted
                        ? 'Publish guest link'
                        : 'Finish the micro-site designer before going live'
                    }
                  >
                    Live
                  </button>
                </div>
              </div>
              {!guestPortalDesignCompleted && (
                <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-900">
                  Complete <strong>Design micro-site</strong> and save there before you can switch to Live.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-900/5 md:p-6">
              <h2 className="text-sm font-black uppercase tracking-wide text-amber-700">Public booking link</h2>
              <p className="mt-2 text-sm text-slate-600">
                Same URL in testing and live. While testing, guests see a “not published” page unless the portal is
                live.
              </p>

              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-100/80 bg-[#fffef8] p-4 sm:flex-row sm:items-center sm:justify-between">
                <code className="break-all text-sm font-semibold text-[#0f3f73]">{customerUrl}</code>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                  >
                    <CopyIcon />
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                  <a
                    href={customerUrl ? `/${merchantSlug}/directportal` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <ExternalIcon />
                    Open guest view
                  </a>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Merchant slug <span className="font-mono font-semibold text-slate-700">{merchantSlug}</span> from “
                {merchantName}”.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wide text-blue-800">Portal copy (draft)</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Quick edits here save as draft. Use <strong>Design micro-site</strong> for layout and to mark design
                    complete.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveDraftContent()}
                  className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save draft'}
                </button>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Welcome headline</span>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#0f3f73] outline-none ring-blue-200 focus:ring-2"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Short welcome message</span>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none ring-blue-200 focus:ring-2"
                />
              </label>
            </section>

            <section className="rounded-2xl border border-amber-100 bg-[#fffbeb]/60 p-5 md:p-6">
              <h2 className="text-sm font-black uppercase tracking-wide text-[#0f3f73]">Next steps</h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-600">
                <li>Use Design micro-site to shape your guest-facing page, then return here to go live.</li>
                <li>Add photos and unit details in Configuration so they can appear on the guest portal.</li>
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default DirectWebsiteBuilderPage
