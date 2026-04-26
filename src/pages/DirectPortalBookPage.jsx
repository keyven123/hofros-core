import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DEFAULT_HERO_BANNER_URL } from '../data/heroBannerPresets'
import GuestPortalDateField from '../components/guestPortal/GuestPortalDateField'
import { apiFetch, resolvePublicStorageUrl } from '../utils/api'
import { displayNameFromSlug } from '../utils/merchantSlug'
import { addDaysToYmd, defaultStayDatesFromToday, toYmdLocal } from '../utils/guestPortalDates'
import { stayRangesOverlap } from '../utils/stayRange'
import { clearPortalSearchIntent, peekPortalSearchIntent } from '../utils/guestPortalSearchIntent'
import {
  formatGuestPortalUnitListingSubtitle,
  guestPortalUnitListingTitle,
  formatGuestPortalUnitNightlyDisplay,
  guestPortalUnitHasNightlyPriceRange,
  guestPortalCurrencySymbol,
} from '../utils/formatGuestPortalUnit'

/** Must match `BookingStayConflict::MAX_PORTAL_UNITS_PER_BOOKING` in the API. */
const DIRECT_PORTAL_MAX_UNITS = 50

function ImagePreviewLightbox({ openIndex, urls, ariaLabel, onClose, onSetIndex }) {
  if (openIndex === null || urls.length === 0 || openIndex < 0 || openIndex >= urls.length) {
    return null
  }

  const src = urls[openIndex]
  const last = urls.length - 1

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-[2] flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xl font-bold text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-5 sm:top-5"
        aria-label="Close preview"
      >
        ×
      </button>
      {openIndex > 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSetIndex(openIndex - 1)
          }}
          className="absolute left-2 top-1/2 z-[2] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-lg font-black text-white backdrop-blur-sm transition hover:bg-white/20 sm:left-4"
          aria-label="Previous image"
        >
          ‹
        </button>
      ) : null}
      {openIndex < last ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSetIndex(openIndex + 1)
          }}
          className="absolute right-2 top-1/2 z-[2] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-lg font-black text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-4"
          aria-label="Next image"
        >
          ›
        </button>
      ) : null}
      <div className="relative z-[1] flex max-h-[min(90vh,900px)] w-full max-w-5xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt=""
          className="max-h-[min(85vh,820px)] w-auto max-w-full rounded-lg object-contain shadow-2xl"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = DEFAULT_HERO_BANNER_URL
          }}
        />
        <p className="mt-4 text-center text-xs font-bold tabular-nums text-white/80">
          {openIndex + 1} / {urls.length}
        </p>
        <p className="mt-1 text-center text-[11px] text-white/50">Click outside or press Esc to close</p>
      </div>
    </div>
  )
}

/** Half-open stay vs portal calendar unit (accepted/assigned bookings + blocks). */
function directPortalStayOverlapsBookingsOrBlocks(unitCal, checkIn, checkOut) {
  if (!unitCal || !checkIn || !checkOut) return false
  for (const b of unitCal.bookings || []) {
    if (b.status !== 'accepted' && b.status !== 'assigned') continue
    if (b.checkIn && b.checkOut && stayRangesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)) {
      return true
    }
  }
  for (const k of unitCal.blocks || []) {
    if (k.startDate && k.endDate && stayRangesOverlap(checkIn, checkOut, k.startDate, k.endDate)) {
      return true
    }
  }
  return false
}

function StepperField({ label, value, min, max, onChange, hint }) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-800">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={dec}
            disabled={value <= min}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Decrease ${label}`}
          >
            −
          </button>
          <span className="min-w-[2rem] text-center text-base font-black tabular-nums text-slate-900">{value}</span>
          <button
            type="button"
            onClick={inc}
            disabled={value >= max}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Increase ${label}`}
          >
            +
          </button>
        </div>
      </div>
      {hint ? <p className="mt-2 text-xs font-medium text-slate-500">{hint}</p> : null}
    </div>
  )
}

function DirectPortalBookPage() {
  const { merchantSlug, unitId } = useParams()
  const navigate = useNavigate()
  const fallbackLabel = useMemo(() => displayNameFromSlug(merchantSlug ?? ''), [merchantSlug])

  const [loading, setLoading] = useState(true)
  const [notPublished, setNotPublished] = useState(false)
  const [error, setError] = useState(null)
  const [payload, setPayload] = useState(null)

  const defaults = useMemo(() => defaultStayDatesFromToday(), [])
  const [guestName, setGuestName] = useState('')
  const [guestMobile, setGuestMobile] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [checkIn, setCheckIn] = useState(defaults.checkIn)
  const [checkOut, setCheckOut] = useState(defaults.checkOut)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submissionReceipt, setSubmissionReceipt] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [stayQuote, setStayQuote] = useState(null)
  const [unitCalendarRow, setUnitCalendarRow] = useState(null)
  const [unitCount, setUnitCount] = useState(1)

  useEffect(() => {
    setLightboxIndex(null)
    setGuestMobile('')
    setGuestEmail('')
    setPromoCode('')
    setUnitCount(1)
    setSubmissionReceipt(null)
  }, [unitId])

  useEffect(() => {
    let cancelled = false
    const slug = merchantSlug ?? ''

    async function run() {
      setLoading(true)
      setNotPublished(false)
      setError(null)
      try {
        const data = await apiFetch(`/v1/public/direct-portals/${encodeURIComponent(slug)}`)
        if (!cancelled) {
          setPayload(data)
        }
      } catch (e) {
        if (cancelled) {
          return
        }
        if (e instanceof Error && e.status === 404) {
          setNotPublished(true)
          setPayload(null)
        } else {
          setError(e instanceof Error ? e.message : 'Could not load portal.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [merchantSlug])

  const primaryColor =
    typeof payload?.primaryColor === 'string' && payload.primaryColor.trim() ? payload.primaryColor.trim() : '#0d9488'
  const title = payload?.merchantName?.trim() || fallbackLabel
  const units = useMemo(() => (Array.isArray(payload?.units) ? payload.units : []), [payload])

  const unit = useMemo(() => {
    const idStr = String(unitId ?? '')
    return units.find((u) => String(u.id) === idStr) ?? null
  }, [units, unitId])

  const maxGuests = useMemo(() => {
    const g = Number(unit?.maxGuests)
    return Number.isFinite(g) && g > 0 ? g : 8
  }, [unit])

  const maxPortalUnits = useMemo(() => {
    const pid = unit?.propertyId
    return pid != null && String(pid) !== '' ? DIRECT_PORTAL_MAX_UNITS : 1
  }, [unit])

  useEffect(() => {
    if (!unit || !merchantSlug || !checkIn || !checkOut || checkOut <= checkIn) {
      setStayQuote(null)
      return
    }
    let cancelled = false
    const slug = merchantSlug ?? ''
    const uid = unit.id

    async function run() {
      setQuoteLoading(true)
      setStayQuote(null)
      try {
        const qs = new URLSearchParams({
          unitId: String(uid),
          checkIn,
          checkOut,
          unitCount: String(Math.min(Math.max(1, unitCount), maxPortalUnits)),
        })
        const promo = promoCode.trim().toUpperCase()
        if (promo) {
          qs.set('promoCode', promo)
        }
        const data = await apiFetch(`/v1/public/direct-portals/${encodeURIComponent(slug)}/quote?${qs.toString()}`)
        if (!cancelled) {
          setStayQuote({
            subtotalPrice: data.subtotalPrice,
            discountAmount: data.discountAmount,
            totalPrice: data.totalPrice,
            nights: data.nights,
            currency: data.currency,
            quotedUnitCount: typeof data.unitCount === 'number' ? data.unitCount : unitCount,
            promoCode: typeof data.promoCode === 'string' ? data.promoCode : null,
          })
        }
      } catch (e) {
        if (!cancelled) {
          setStayQuote({
            error: e instanceof Error ? e.message : 'Could not estimate total.',
          })
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [unit, merchantSlug, checkIn, checkOut, unitCount, maxPortalUnits, promoCode])

  useEffect(() => {
    setFormError(null)
  }, [checkIn, checkOut, unitCount, promoCode])

  useEffect(() => {
    if (!merchantSlug || !unit?.id) {
      setUnitCalendarRow(null)
      return
    }
    let cancelled = false
    const slug = merchantSlug ?? ''
    const from = toYmdLocal(new Date())
    const to = addDaysToYmd(from, 400)
    const qs = new URLSearchParams({ from, to, unitId: String(unit.id) })

    async function run() {
      try {
        const data = await apiFetch(`/v1/public/direct-portals/${encodeURIComponent(slug)}/calendar?${qs.toString()}`)
        if (cancelled) return
        const rows = Array.isArray(data?.units) ? data.units : []
        const row = rows.find((r) => String(r.id) === String(unit.id)) ?? rows[0] ?? null
        setUnitCalendarRow(row)
      } catch {
        if (!cancelled) {
          setUnitCalendarRow(null)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [merchantSlug, unit?.id])

  const datesUnavailable = useMemo(() => {
    if (!unitCalendarRow || !checkIn || !checkOut || checkOut <= checkIn) return false
    return directPortalStayOverlapsBookingsOrBlocks(unitCalendarRow, checkIn, checkOut)
  }, [unitCalendarRow, checkIn, checkOut])

  useEffect(() => {
    setUnitCount((c) => Math.min(Math.max(1, c), maxPortalUnits))
  }, [maxPortalUnits])

  useEffect(() => {
    if (!unit) {
      return
    }
    const slug = merchantSlug ?? ''
    const intent = peekPortalSearchIntent(slug)
    if (!intent) {
      return
    }
    const { checkIn: ci, checkOut: co, guests: gv } = intent
    const ymdOk = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
    if (!ymdOk(ci) || !ymdOk(co) || co <= ci) {
      clearPortalSearchIntent()
      return
    }
    clearPortalSearchIntent()
    setCheckIn(ci)
    setCheckOut(co)
    const g = Math.min(Math.max(1, gv), maxGuests)
    setAdults(g)
    setChildren(0)
  }, [unit, merchantSlug, maxGuests])

  useEffect(() => {
    if (!unit) {
      return
    }
    if (adults + children > maxGuests) {
      setChildren(Math.max(0, maxGuests - adults))
    }
    if (adults > maxGuests) {
      setAdults(maxGuests)
    }
  }, [unit, maxGuests, adults, children])

  function handleCheckInChange(e) {
    const v = e.target.value
    setCheckIn(v)
    if (v && checkOut && checkOut <= v) {
      const d = new Date(`${v}T12:00:00`)
      d.setDate(d.getDate() + 1)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      setCheckOut(`${y}-${m}-${day}`)
    }
  }

  function handleAdultsChange(next) {
    const a = Math.max(1, Math.min(maxGuests, next))
    setAdults(a)
    if (a + children > maxGuests) {
      setChildren(Math.max(0, maxGuests - a))
    }
  }

  function handleChildrenChange(next) {
    const c = Math.max(0, Math.min(maxGuests - adults, next))
    setChildren(c)
  }

  function handleUnitCountChange(next) {
    const u = Math.max(1, Math.min(maxPortalUnits, next))
    setUnitCount(u)
  }

  async function handleConfirm(e) {
    e.preventDefault()
    setFormError(null)
    const name = guestName.trim()
    const mobileTrim = guestMobile.trim()
    const emailTrim = guestEmail.trim()
    if (!name) {
      setFormError('Please enter the guest name.')
      return
    }
    if (!mobileTrim) {
      setFormError('Please enter your mobile number.')
      return
    }
    const mobileDigits = mobileTrim.replace(/\D/g, '')
    if (mobileDigits.length < 8 || mobileDigits.length > 15) {
      setFormError('Please enter a valid mobile number (8–15 digits).')
      return
    }
    if (!emailTrim) {
      setFormError('Please enter your email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setFormError('Please enter a valid email address.')
      return
    }
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setFormError('Check-out must be after check-in.')
      return
    }
    if (unitCalendarRow && directPortalStayOverlapsBookingsOrBlocks(unitCalendarRow, checkIn, checkOut)) {
      setFormError('These dates overlap a blocked period or an existing reservation. Please choose different dates.')
      return
    }
    if (adults < 1) {
      setFormError('At least one adult is required.')
      return
    }
    if (adults + children > maxGuests) {
      setFormError(`This listing allows at most ${maxGuests} guests total.`)
      return
    }
    if (stayQuote && typeof stayQuote === 'object' && 'error' in stayQuote && stayQuote.error) {
      setFormError(stayQuote.error)
      return
    }
    const slug = merchantSlug ?? ''
    setSubmitting(true)
    try {
      const data = await apiFetch(`/v1/public/direct-portals/${encodeURIComponent(slug)}/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          unitId: Number(unit.id),
          guestName: name,
          guestEmail: emailTrim,
          guestPhone: mobileTrim,
          checkIn,
          checkOut,
          adults,
          children,
          unitCount: Math.min(Math.max(1, unitCount), maxPortalUnits),
          promoCode: promoCode.trim() ? promoCode.trim().toUpperCase() : null,
        }),
      })
      const refs = Array.isArray(data?.references)
        ? data.references.filter((r) => typeof r === 'string' && r.trim())
        : typeof data?.reference === 'string' && data.reference.trim()
          ? [data.reference.trim()]
          : []
      const cur = Math.min(Math.max(1, unitCount), maxPortalUnits)
      setSubmissionReceipt({
        references: refs,
        totalAmount: typeof data?.totalAmount === 'number' ? data.totalAmount : null,
        subtotalAmount: typeof data?.subtotalAmount === 'number' ? data.subtotalAmount : null,
        discountAmount: typeof data?.discountAmount === 'number' ? data.discountAmount : null,
        promoCode: typeof data?.promoCode === 'string' ? data.promoCode : null,
        currency:
          typeof stayQuote?.currency === 'string'
            ? stayQuote.currency
            : typeof unit?.currency === 'string'
              ? unit.currency
              : 'PHP',
        unitCount: typeof data?.unitCount === 'number' ? data.unitCount : cur,
      })
      setSubmitted(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit your booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const portalPath = `/${merchantSlug}/directportal`

  const { mainImage, otherPropertyImages, resolvedUnitImages } = useMemo(() => {
    const raw = Array.isArray(unit?.images) ? unit.images : []
    const resolved = raw
      .map((u) => (typeof u === 'string' ? resolvePublicStorageUrl(u.trim()) : ''))
      .filter(Boolean)
    const seen = new Set()
    const uniq = []
    for (const url of resolved) {
      if (!seen.has(url)) {
        seen.add(url)
        uniq.push(url)
      }
    }
    return {
      mainImage: uniq[0] || DEFAULT_HERO_BANNER_URL,
      otherPropertyImages: uniq.slice(1),
      resolvedUnitImages: uniq,
    }
  }, [unit])

  useEffect(() => {
    if (lightboxIndex === null) {
      return undefined
    }
    const maxIdx = Math.max(0, resolvedUnitImages.length - 1)

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setLightboxIndex(null)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setLightboxIndex((i) => (i === null || i <= 0 ? i : i - 1))
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setLightboxIndex((i) => (i === null || i >= maxIdx ? i : i + 1))
      }
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [lightboxIndex, resolvedUnitImages])

  useEffect(() => {
    if (lightboxIndex === null) {
      return
    }
    if (resolvedUnitImages.length === 0) {
      setLightboxIndex(null)
      return
    }
    if (lightboxIndex >= resolvedUnitImages.length) {
      setLightboxIndex(resolvedUnitImages.length - 1)
    }
  }, [lightboxIndex, resolvedUnitImages])

  const descriptionText = [unit?.description, unit?.details].find((t) => typeof t === 'string' && t.trim())?.trim() ?? ''

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-16 text-center">
        <p className="text-sm text-rose-700">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-teal-700 hover:underline">
          hofros home
        </Link>
      </div>
    )
  }

  if (notPublished || !payload) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-16 text-center">
        <p className="text-sm text-slate-600">This booking link is not available.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-teal-700 hover:underline">
          hofros home
        </Link>
      </div>
    )
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-16 text-center">
        <h1 className="text-lg font-black text-slate-800">Listing not found</h1>
        <p className="mt-2 text-sm text-slate-600">This listing may have been removed or is no longer active.</p>
        <button
          type="button"
          onClick={() => navigate(portalPath)}
          className="mt-6 inline-flex rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Back to listings
        </button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200/90 px-4 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-slate-900/10">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-inner"
            style={{ backgroundColor: primaryColor }}
          >
            ✓
          </div>
          <h1 className="mt-5 text-xl font-black text-slate-900">Request received</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Thank you, <span className="font-bold text-slate-800">{guestName.trim()}</span>. {title} will follow up at{' '}
            <span className="font-bold text-slate-800">{guestEmail.trim()}</span> to confirm your stay for{' '}
            <span className="font-bold text-slate-800">{guestPortalUnitListingTitle(unit)}</span>.
          </p>
          {submissionReceipt?.references?.length > 0 ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700">
              <p className="font-bold text-slate-800">
                Reservation reference{submissionReceipt.references.length > 1 ? 's' : ''}
              </p>
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-slate-900">
                {submissionReceipt.references.map((ref) => (
                  <li key={ref}>{ref}</li>
                ))}
              </ul>
              {submissionReceipt.totalAmount != null && Number.isFinite(Number(submissionReceipt.totalAmount)) ? (
                <p className="mt-3 border-t border-slate-200 pt-2 text-[11px] text-slate-800">
                  Combined total ({submissionReceipt.unitCount} unit
                  {submissionReceipt.unitCount === 1 ? '' : 's'}):{' '}
                  <span className="font-black tabular-nums">
                    {guestPortalCurrencySymbol(submissionReceipt.currency)}
                    {Number(submissionReceipt.totalAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => navigate(portalPath)}
            className="mt-8 w-full rounded-xl py-3 text-sm font-black text-white shadow-md transition hover:opacity-95"
            style={{ backgroundColor: primaryColor }}
          >
            Back to {title}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 px-3 py-6 sm:px-6 sm:py-10">
      <ImagePreviewLightbox
        openIndex={lightboxIndex}
        urls={resolvedUnitImages}
        ariaLabel={`${unit.name} — photo preview`}
        onClose={() => setLightboxIndex(null)}
        onSetIndex={setLightboxIndex}
      />
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(portalPath)}
            className="text-sm font-bold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            ← Back to listings
          </button>
          <p className="text-xs font-semibold text-slate-400">{title}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/[0.08]">
          <div className="flex flex-col md:flex-row">
            <div className="relative md:w-[42%] md:shrink-0">
              <div className="aspect-[4/3] w-full bg-slate-100 md:aspect-auto md:min-h-[280px] md:h-full">
                {resolvedUnitImages.length > 0 ? (
                  <button
                    type="button"
                    className="group relative block h-full min-h-[inherit] w-full cursor-zoom-in border-0 bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                    onClick={() => setLightboxIndex(0)}
                    aria-label={`View larger photo: ${unit.name}`}
                  >
                    <img
                      src={mainImage}
                      alt={unit.name}
                      className="h-full w-full object-cover transition group-hover:brightness-[0.97]"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = DEFAULT_HERO_BANNER_URL
                      }}
                    />
                  </button>
                ) : (
                  <img
                    src={mainImage}
                    alt={unit.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = DEFAULT_HERO_BANNER_URL
                    }}
                  />
                )}
              </div>
              <div
                className="absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                Your selection
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center p-5 sm:p-7">
              <h1 className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">{guestPortalUnitListingTitle(unit)}</h1>
              <p className="mt-1.5 text-xs font-semibold text-slate-500 sm:text-sm">{formatGuestPortalUnitListingSubtitle(unit)}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {descriptionText || 'Details for this listing are configured in your host dashboard.'}
              </p>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {guestPortalUnitHasNightlyPriceRange(unit) ? 'Nightly rate (range)' : 'From (lowest nightly)'}
                  </p>
                  <p className="text-lg font-black tabular-nums" style={{ color: primaryColor }}>
                    {formatGuestPortalUnitNightlyDisplay(unit)}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-slate-500">Full stay total updates below from your rate calendar.</p>
                  <div
                    className="mt-2.5 rounded-r-lg border border-amber-200/90 border-l-[4px] border-l-amber-500 bg-amber-50 px-3 py-2.5 shadow-sm"
                    role="note"
                  >
                    <p className="text-[10px] font-black uppercase tracking-wide text-amber-900/90">Important</p>
                    <p className="mt-1 text-xs font-semibold leading-snug text-amber-950">
                      Price may vary depending on the season or selected date.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {otherPropertyImages.length > 0 ? (
            <div className="border-t border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">Property Images</h3>
              <p className="mt-1 text-[11px] text-slate-500">More photos of this listing from your host.</p>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {otherPropertyImages.map((src, thumbIdx) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setLightboxIndex(1 + thumbIdx)}
                    className="relative shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 shadow-sm ring-0 transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                    aria-label={`View property image ${thumbIdx + 2} larger`}
                  >
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className="pointer-events-none h-28 w-40 object-cover sm:h-32 sm:w-44"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = DEFAULT_HERO_BANNER_URL
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <form onSubmit={handleConfirm} className="border-t border-slate-100 px-5 py-6 sm:px-8 sm:py-8">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">Complete your booking</h2>
            <p className="mt-1 text-xs text-slate-500">Enter guest details and stay dates. Your host will confirm availability.</p>

            {formError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                {formError}
              </div>
            ) : null}

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">Guest name</span>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  autoComplete="name"
                  placeholder="Full name as on ID"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">Mobile number</span>
                  <input
                    type="tel"
                    value={guestMobile}
                    onChange={(e) => setGuestMobile(e.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+63 9xx xxx xxxx"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">Email address</span>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">Promo code (optional)</span>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold uppercase text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <GuestPortalDateField
                  variant="form"
                  label="Check-in"
                  value={checkIn}
                  minYmd={toYmdLocal(new Date())}
                  onChange={handleCheckInChange}
                  primaryColor={primaryColor}
                />
                <GuestPortalDateField
                  variant="form"
                  label="Check-out"
                  value={checkOut}
                  minYmd={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  primaryColor={primaryColor}
                />
              </div>
              {quoteLoading ? (
                <p className="text-xs font-medium text-slate-500">Calculating estimated total for these dates…</p>
              ) : null}
              {stayQuote && 'totalPrice' in stayQuote && !quoteLoading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                  {typeof stayQuote.subtotalPrice === 'number' && typeof stayQuote.discountAmount === 'number' && stayQuote.discountAmount > 0 ? (
                    <>
                      <p className="text-xs font-semibold text-slate-600">
                        Subtotal:{' '}
                        <span className="tabular-nums">
                          {guestPortalCurrencySymbol(stayQuote.currency)}
                          {Number(stayQuote.subtotalPrice).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                      <p className="text-xs font-semibold text-emerald-700">
                        Promo {stayQuote.promoCode ?? ''}: -{guestPortalCurrencySymbol(stayQuote.currency)}
                        {Number(stayQuote.discountAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </>
                  ) : null}
                  <p className="font-bold text-slate-800">
                    Estimated total:{' '}
                    <span className="tabular-nums">
                      {guestPortalCurrencySymbol(stayQuote.currency)}
                      {Number(stayQuote.totalPrice).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {stayQuote.nights} night{stayQuote.nights === 1 ? '' : 's'}
                    {typeof stayQuote.quotedUnitCount === 'number' && stayQuote.quotedUnitCount > 1
                      ? ` · ${stayQuote.quotedUnitCount} units`
                      : ''}{' '}
                    — uses Availability / Base Rates when they cover these nights; otherwise the listing’s default nightly
                    rate.
                  </p>
                </div>
              ) : null}
              {stayQuote && 'error' in stayQuote && stayQuote.error ? (
                <div
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900"
                  role="alert"
                >
                  {stayQuote.error}
                </div>
              ) : null}
              {datesUnavailable ? (
                <div
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900"
                  role="alert"
                >
                  These dates are not available for this listing (blocked or already booked). Choose other check-in or
                  check-out dates.
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StepperField
                  label="Adults"
                  value={adults}
                  min={1}
                  max={Math.max(1, maxGuests - children)}
                  onChange={handleAdultsChange}
                />
                <StepperField
                  label="Children"
                  value={children}
                  min={0}
                  max={Math.max(0, maxGuests - adults)}
                  onChange={handleChildrenChange}
                  hint={`Max: ${maxGuests} guests total for this listing`}
                />
                <StepperField
                  label="Units"
                  value={unitCount}
                  min={1}
                  max={maxPortalUnits}
                  onChange={handleUnitCountChange}
                  hint={
                    maxPortalUnits > 1
                      ? 'Same dates and guest details apply to each matching room. If not enough are free for these dates, an error message will appear.'
                      : 'This listing has a single room; only one unit can be booked.'
                  }
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(portalPath)}
                className="w-full rounded-xl border-2 border-slate-300 bg-white py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:min-w-[7.5rem]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  quoteLoading ||
                  datesUnavailable ||
                  !!(stayQuote && typeof stayQuote === 'object' && 'error' in stayQuote && stayQuote.error)
                }
                title={
                  datesUnavailable
                    ? 'These dates overlap a block or an existing reservation.'
                    : stayQuote && typeof stayQuote === 'object' && 'error' in stayQuote && stayQuote.error
                      ? 'Fix dates or wait for the price check to finish before confirming.'
                      : undefined
                }
                className="w-full rounded-xl py-3 text-sm font-black text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[9rem]"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? 'Submitting…' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DirectPortalBookPage
