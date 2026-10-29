import { useMemo, useState } from 'react'
import PortalSearchResultsModal from './PortalSearchResultsModal'
import { resolveDesignTemplate } from '../../data/designTemplates'
import { resolveHeroBannerUrl } from '../../data/heroBannerPresets'
import GuestPortalDateField from './GuestPortalDateField'
import {
  dedupeGuestPortalListings,
  formatGuestPortalUnitListingSubtitle,
  formatGuestPortalUnitNightlyDisplay,
  guestPortalUnitHasNightlyPriceRange,
  guestPortalUnitListingTitle,
} from '../../utils/formatGuestPortalUnit'
import { defaultStayDatesFromToday } from '../../utils/guestPortalDates'
import { savePortalSearchIntent } from '../../utils/guestPortalSearchIntent'
import { emphasisTextOnLightBg, ratingStarColorOnLightBg } from '../../utils/guestPortalColorContrast'
import { contactSendButtonProps, micrositeChrome } from '../../utils/guestPortalThemeStyles'

/** Must match `emptyGuestPortalLayout().sectionOrder` — used when layout omits ids or order is empty. */
const DEFAULT_MICROSITE_SECTION_ORDER = ['hero', 'units', 'amenities', 'reviews', 'contact']

function normalizeMicrositeSectionOrder(raw) {
  const defaults = DEFAULT_MICROSITE_SECTION_ORDER
  const allowed = new Set(defaults)
  const list = Array.isArray(raw) ? raw : []
  const seen = new Set()
  const out = []
  for (const id of list) {
    if (typeof id === 'string' && allowed.has(id) && !seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  for (const id of defaults) {
    if (!seen.has(id)) {
      out.push(id)
    }
  }
  return out
}

function cssBackgroundUrl(imageUrl) {
  const u = resolveHeroBannerUrl(imageUrl)
  return `url(${JSON.stringify(u)})`
}

function amenityIconSvg(label) {
  const l = (label ?? '').toLowerCase()
  if (l.includes('wifi')) {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12.55a11 11 0 0 1 14.08 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" strokeLinecap="round" />
      </svg>
    )
  }
  if (l.includes('park')) {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="8" rx="1" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    )
  }
  if (l.includes('air') || l.includes('ac')) {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" strokeLinecap="round" />
      </svg>
    )
  }
  if (l.includes('pool')) {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12c2.5 2 5.5 2 8 0s5.5-2 8 0M2 17c2.5 2 5.5 2 8 0s5.5-2 8 0" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" strokeLinejoin="round" />
    </svg>
  )
}

function PersonIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HeroGuestPill({ guests, onChange, width = 'pill' }) {
  const widthClass =
    width === 'full'
      ? 'w-full'
      : width === 'bar'
        ? 'portal-search-guest'
        : 'portal-pill-guest'
  return (
    <div className={`relative flex h-11 min-w-0 items-center gap-2 overflow-hidden rounded-full border border-slate-200/90 bg-white px-3 shadow-sm ${widthClass}`}>
      <PersonIcon className="pointer-events-none relative z-[1] h-[1.05rem] w-[1.05rem] shrink-0 text-slate-500" />
      <select
        value={guests}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="relative z-[1] min-w-0 flex-1 cursor-pointer appearance-none border-0 bg-transparent py-0.5 pl-0.5 pr-6 text-sm font-semibold text-slate-700 outline-none focus:ring-0"
        aria-label="Number of guests"
      >
        {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n === 1 ? '1 Guest' : `${n} Guests`}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  )
}

function HeroSearchBanner({ accentColor, primaryColor, slug, persistSearchIntent, onShowResults, shape = 'pill' }) {
  const defaults = useMemo(() => defaultStayDatesFromToday(), [])

  const [checkIn, setCheckIn] = useState(defaults.checkIn)
  const [checkOut, setCheckOut] = useState(defaults.checkOut)
  const [guests, setGuests] = useState(1)

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

  function handleSearch() {
    if (persistSearchIntent && slug) {
      savePortalSearchIntent({ slug, checkIn, checkOut, guests })
    }
    onShowResults?.({ checkIn, checkOut, guests })
  }

  const isColumn = shape === 'stack' || shape === 'column'
  const isBar = shape === 'bar' || shape === 'glass'
  const shell = {
    pill: 'portal-pill w-full rounded-full border border-white/45 bg-white/30 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.2)] backdrop-blur-md sm:p-2',
    stack: 'w-full max-w-sm rounded-[1.75rem] bg-white p-3 shadow-lg',
    bar: 'w-full rounded-2xl border border-slate-200/80 bg-white p-2 shadow-md',
    glass: 'w-full',
    column: 'w-full max-w-xs',
  }[shape]
  const row = {
    pill: 'portal-pill-row',
    stack: 'flex w-full flex-col gap-2',
    bar: 'portal-search-bar',
    glass: 'portal-search-bar',
    column: 'flex w-full flex-col gap-2',
  }[shape]
  const dateClass = shape === 'pill' ? 'portal-pill-field' : isBar ? 'portal-search-field' : ''
  const buttonClass = {
    pill: 'portal-pill-go flex h-11 shrink-0 items-center justify-center rounded-full px-9 text-sm font-black text-[#0f3f73] shadow-sm transition hover:brightness-[1.02] sm:px-10',
    stack: 'flex h-11 w-full items-center justify-center rounded-full px-6 text-sm font-black text-[#0f3f73] shadow-sm',
    bar: 'portal-search-go flex h-11 shrink-0 items-center justify-center rounded-xl px-8 text-sm font-black text-[#0f3f73] shadow-sm',
    glass: 'portal-search-go flex h-11 shrink-0 items-center justify-center rounded-full px-8 text-sm font-black text-[#12304f] shadow-sm',
    column: 'flex h-11 w-full items-center justify-center px-6 text-xs font-black uppercase tracking-[0.18em] text-[#1c1917]',
  }[shape]

  return (
    <div className={shell}>
      <div className={row}>
        <GuestPortalDateField
          variant="hero"
          ariaLabel="Check-in date"
          value={checkIn}
          onChange={handleCheckInChange}
          primaryColor={primaryColor}
          className={dateClass}
        />
        <GuestPortalDateField
          variant="hero"
          ariaLabel="Check-out date"
          value={checkOut}
          minYmd={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
          primaryColor={primaryColor}
          className={dateClass}
        />
        <HeroGuestPill guests={guests} onChange={setGuests} width={isColumn ? 'full' : isBar ? 'bar' : 'pill'} />
        <button
          type="button"
          className={buttonClass}
          style={{ backgroundColor: accentColor }}
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
    </div>
  )
}

function StarRow({ count, color }) {
  const n = Math.min(5, Math.max(0, Number(count) || 0))
  return (
    <div className="flex gap-0.5" aria-label={`${n} of 5 stars`}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="text-sm leading-none" style={{ color: color }}>
          ★
        </span>
      ))}
    </div>
  )
}

function UnitListing({
  composition,
  featured,
  index,
  unit,
  primaryColor,
  priceOnCardColor,
  bookHref,
  LinkComponent,
  chrome,
  accentColor,
}) {
  const useBookLink = Boolean(bookHref) && LinkComponent !== 'span'
  const BookTag = useBookLink ? LinkComponent : 'button'
  const bookProps = useBookLink
    ? LinkComponent === 'a'
      ? { href: bookHref }
      : { to: bookHref }
    : { type: 'button' }
  const title = guestPortalUnitListingTitle(unit)
  const subtitle = formatGuestPortalUnitListingSubtitle(unit)
  const priceLabel = `${guestPortalUnitHasNightlyPriceRange(unit) ? '' : 'From '}${formatGuestPortalUnitNightlyDisplay(unit)}`

  function price(className) {
    return (
      <span className={className} style={{ color: priceOnCardColor }}>
        {priceLabel}
      </span>
    )
  }

  function icon(className) {
    return (
      <div className={className || chrome.unitIcon} style={{ backgroundColor: primaryColor }}>
        ⌂
      </div>
    )
  }

  function book(className, style) {
    return (
      <BookTag {...bookProps} className={className} style={style || { backgroundColor: primaryColor }}>
        Book
      </BookTag>
    )
  }

  if (composition === 'soft') {
    return (
      <li className="portal-unit-row flex flex-col gap-4 rounded-[1.75rem] bg-white p-4 shadow-md sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {icon()}
          <div className="min-w-0">
            <p className="text-sm font-bold leading-snug text-slate-900">{title}</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          {price('shrink-0 text-sm font-black tabular-nums')}
          {book('inline-flex shrink-0 items-center justify-center rounded-full px-6 py-2.5 text-xs font-black text-white no-underline')}
        </div>
      </li>
    )
  }

  if (composition === 'minimal') {
    return (
      <li className="portal-inline flex gap-3 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          {price('shrink-0 text-sm font-semibold tabular-nums')}
          {book(
            'inline-flex shrink-0 items-center justify-center px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white no-underline',
          )}
        </div>
      </li>
    )
  }

  if (composition === 'nature') {
    if (featured) {
      return (
        <li className="portal-feature flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          {icon('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white')}
          <div className="min-w-0 flex-1">
            <p className="text-base font-black leading-snug text-stone-900">{title}</p>
            <p className="mt-1 text-xs leading-snug text-stone-500">{subtitle}</p>
          </div>
          <div className="portal-end flex items-center justify-between gap-4">
            {price('text-lg font-black tabular-nums')}
            {book('inline-flex shrink-0 items-center justify-center rounded-2xl px-6 py-2.5 text-xs font-black text-white no-underline')}
          </div>
        </li>
      )
    }
    return (
      <li className="flex flex-col rounded-3xl border border-emerald-900/10 bg-white p-5">
        {icon()}
        <p className="mt-4 text-sm font-bold leading-snug text-stone-900">{title}</p>
        <p className="mt-1 text-xs leading-snug text-stone-500">{subtitle}</p>
        {price('mt-4 text-sm font-black tabular-nums')}
        {book('mt-4 inline-flex w-full items-center justify-center rounded-2xl py-2.5 text-center text-xs font-black text-white no-underline')}
      </li>
    )
  }

  if (composition === 'luxe') {
    return (
      <li className="overflow-hidden rounded-[1.6rem] bg-white shadow-lg">
        <div className="h-1.5 w-full" style={{ backgroundColor: primaryColor }} />
        <div className="flex flex-col gap-4 p-5">
          <div className="min-w-0">
            <p className="text-base font-black leading-snug text-slate-900">{title}</p>
            <p className="mt-1 text-xs leading-snug text-slate-500">{subtitle}</p>
          </div>
          {price('text-sm font-black tabular-nums')}
          {book('inline-flex w-full items-center justify-center rounded-full py-2.5 text-xs font-black text-white no-underline')}
        </div>
      </li>
    )
  }

  if (composition === 'gallery') {
    return (
      <li className="portal-inline flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        {price('shrink-0 text-lg font-black tabular-nums')}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-500">{subtitle}</p>
        </div>
        {book('inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-xs font-black text-white no-underline')}
      </li>
    )
  }

  if (composition === 'ribbon') {
    return (
      <li className="flex flex-col gap-4 rounded-[1.5rem] bg-white p-5 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black leading-snug text-slate-900">{title}</p>
            <p className="mt-1 text-xs leading-snug text-slate-500">{subtitle}</p>
          </div>
          <span className="shrink-0 rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: primaryColor }}>
            {priceLabel}
          </span>
        </div>
        {book('inline-flex w-full items-center justify-center rounded-full py-2.5 text-xs font-black text-white no-underline')}
      </li>
    )
  }

  if (composition === 'sanctuary') {
    return (
      <li className="flex flex-col items-center rounded-[1.75rem] bg-white p-6 text-center shadow-md">
        {icon('flex h-12 w-12 items-center justify-center rounded-full text-base font-black text-white')}
        <p className="mt-4 text-sm font-black leading-snug text-stone-900">{title}</p>
        <p className="mt-1 text-xs leading-snug text-stone-500">{subtitle}</p>
        {price('mt-3 text-sm font-black tabular-nums')}
        {book('mt-4 inline-flex w-full items-center justify-center rounded-full py-2.5 text-xs font-black text-white no-underline')}
      </li>
    )
  }

  if (
    composition === 'royal' ||
    composition === 'palace' ||
    composition === 'imperial' ||
    composition === 'regent' ||
    composition === 'sovereign' ||
    composition === 'dynasty'
  ) {
    return (
      <li className="portal-premium-room relative overflow-hidden rounded-2xl border border-[#e8c872]/80 bg-white p-5 shadow-md">
        <div className="portal-premium-bar absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accentColor }} />
        <p className="text-base font-semibold leading-snug" style={{ color: primaryColor }}>
          {title}
        </p>
        <p className="mt-1 text-xs leading-snug text-stone-500">{subtitle}</p>
        {price('mt-3 block text-sm font-semibold tabular-nums')}
        {book(
          'mt-4 inline-flex w-full items-center justify-center rounded-full py-2.5 text-[11px] font-black uppercase tracking-[0.14em] no-underline',
          { backgroundColor: accentColor, color: '#1a1408' },
        )}
      </li>
    )
  }

  if (composition === 'atrium' || composition === 'harbor' || composition === 'ledger') {
    const num = String(index + 1).padStart(2, '0')
    return (
      <li className="portal-editorial-row grid grid-cols-1 gap-3 border-b border-slate-200 py-4">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-400">{num}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          {price('text-sm font-semibold tabular-nums')}
          {book('inline-flex shrink-0 items-center justify-center px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white no-underline')}
        </div>
      </li>
    )
  }

  if (composition === 'concierge') {
    return (
      <li className="portal-inline flex gap-4 border-b border-stone-200 py-4">
        {price('shrink-0 text-base font-semibold tabular-nums')}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900">{title}</p>
          <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>
        </div>
        {book('inline-flex shrink-0 items-center justify-center border border-stone-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white no-underline')}
      </li>
    )
  }

  if (composition === 'monument') {
    return (
      <li className="border-b border-slate-200 py-5">
        <div className="portal-inline flex gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            {price('text-sm font-semibold tabular-nums')}
            {book('inline-flex shrink-0 items-center justify-center bg-transparent px-0 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] no-underline', {
              color: primaryColor,
              backgroundColor: 'transparent',
            })}
          </div>
        </div>
      </li>
    )
  }

  if (composition === 'residence') {
    return (
      <li className="border border-stone-200 bg-white p-5">
        <div className="mb-4 h-px w-8" style={{ backgroundColor: primaryColor }} />
        <p className="text-sm font-semibold text-stone-900">{title}</p>
        <p className="mt-1 text-xs text-stone-500">{subtitle}</p>
        {price('mt-4 text-sm font-semibold tabular-nums')}
        {book('mt-4 inline-flex w-full items-center justify-center py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white no-underline')}
      </li>
    )
  }

  if (composition === 'midnight') {
    return (
      <li className="rounded-3xl border border-[#d4af37]/35 bg-white/5 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#f6f1e6]">{title}</p>
        <p className="mt-1 text-xs leading-snug text-white/55">{subtitle}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-black tabular-nums" style={{ color: accentColor }}>
            {priceLabel}
          </span>
          {book('inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2 text-xs font-black no-underline', {
            backgroundColor: accentColor,
            color: '#1a1408',
          })}
        </div>
      </li>
    )
  }

  if (composition === 'editorial') {
    const num = String(index + 1).padStart(2, '0')
    return (
      <li className="portal-editorial-row grid grid-cols-1 gap-3 border-b border-stone-300 py-5">
        <span className="text-xs font-black tracking-[0.2em] text-stone-400">{num}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-stone-900">{title}</p>
          <p className="mt-1 text-xs leading-snug text-stone-500">{subtitle}</p>
        </div>
        <div className="portal-end flex items-center justify-between gap-4">
          {price('text-sm font-semibold tabular-nums')}
          {book(
            'inline-flex items-center justify-center bg-transparent px-0 py-1 text-[11px] font-black uppercase tracking-[0.16em] no-underline',
            { color: primaryColor, backgroundColor: 'transparent' },
          )}
        </div>
      </li>
    )
  }

  return (
    <li className={chrome.unitCard}>
      <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon()}
          <div className="min-w-0">
            <p className="text-sm font-bold leading-snug text-slate-900">{title}</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{subtitle}</p>
          </div>
        </div>
        {price('shrink-0 text-sm font-black tabular-nums')}
      </div>
      {book(chrome.bookBtn)}
    </li>
  )
}

export default function GuestPortalMicrosite({
  layout,
  headline,
  message,
  primaryColor,
  accentColor,
  heroImageUrl,
  merchantNameFallback,
  slug,
  themePreset = 'bold_modern',
  units = [],
  LinkComponent = 'a',
  linkHomeProps = { href: '/' },
  bookTo,
  embedded = false,
}) {
  const brand = (layout?.businessName ?? '').trim() || merchantNameFallback || 'My Hotel'
  const hero = resolveHeroBannerUrl(heroImageUrl)
  const year = new Date().getFullYear()
  const vis = layout?.sectionVisibility ?? {}
  const sectionOrder = useMemo(() => normalizeMicrositeSectionOrder(layout?.sectionOrder), [layout?.sectionOrder])
  const showReviewsExtra = layout?.showReviews !== false
  const showMap = layout?.showMap !== false
  const templateId = resolveDesignTemplate(layout?.designTemplate, themePreset)
  const chrome = micrositeChrome(templateId)
  const headingColor = chrome.headingColor || primaryColor
  const centeredHeader =
    chrome.composition === 'soft' ||
    chrome.composition === 'sanctuary' ||
    chrome.composition === 'royal' ||
    chrome.composition === 'imperial' ||
    chrome.composition === 'sovereign'
  const sendBtn = contactSendButtonProps(templateId, primaryColor)
  const priceOnCardColor = emphasisTextOnLightBg(accentColor, primaryColor)
  const starOnCardColor = ratingStarColorOnLightBg(accentColor)
  const [searchModalQuery, setSearchModalQuery] = useState(null)

  function renderSection(id) {
    /* Default visible; only hide when explicitly false (missing key = show, matches backend GuestPortalLayout). */
    if (vis[id] === false) {
      return null
    }

    if (id === 'hero') {
      const search = (
        <HeroSearchBanner
          accentColor={accentColor}
          primaryColor={primaryColor}
          slug={slug}
          persistSearchIntent={Boolean(typeof bookTo === 'function' && slug)}
          onShowResults={(q) => setSearchModalQuery(q)}
          shape={chrome.searchShape}
        />
      )

      if (chrome.composition === 'soft') {
        return (
          <section key="hero" className="bg-gradient-to-br from-sky-50 via-white to-amber-50 px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
            <div className="portal-split mx-auto max-w-6xl">
              <div>
                <h1 className="portal-title font-bold tracking-tight" style={{ color: primaryColor }}>
                  {headline}
                </h1>
                <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">{message}</p>
                <div className="mt-6">{search}</div>
              </div>
              <div
                className="min-h-[16rem] overflow-hidden rounded-[2rem] shadow-lg sm:min-h-[24rem]"
                style={{
                  backgroundImage: cssBackgroundUrl(hero),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                role="img"
                aria-label="Property photo"
              />
            </div>
          </section>
        )
      }

      if (chrome.composition === 'minimal') {
        return (
          <section key="hero" className="bg-white">
            <div className="w-full max-w-3xl px-4 pb-6 pt-10 sm:px-6 lg:px-8">
              <h1 className="portal-title font-semibold tracking-tight text-slate-900">
                {headline}
              </h1>
              <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">{message}</p>
            </div>
            <div
              className="h-44 w-full sm:h-64"
              style={{
                backgroundImage: cssBackgroundUrl(hero),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              role="img"
              aria-label="Property photo"
            />
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8">{search}</div>
          </section>
        )
      }

      if (chrome.composition === 'nature') {
        return (
          <section
            key="hero"
            className="relative flex min-h-[min(78dvh,40rem)] items-end"
            style={{
              backgroundColor: '#14532d',
              backgroundImage: `linear-gradient(to top, rgba(28,25,23,0.88), rgba(21,128,61,0.12)), ${cssBackgroundUrl(hero)}`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="w-full px-4 pb-6 pt-28 sm:px-8 sm:pb-8 lg:px-12">
              <h1 className="portal-title max-w-xl text-left font-black text-white">
                {headline}
              </h1>
              <p className="mt-3 max-w-lg text-left text-pretty text-sm leading-relaxed text-white/90 sm:text-base">{message}</p>
              <div className="mt-6">{search}</div>
            </div>
          </section>
        )
      }

      if (chrome.composition === 'editorial') {
        return (
          <section key="hero" className="portal-split portal-split-stretch">
            <div className="flex flex-col justify-end bg-[#1c1917] px-6 py-10 text-white sm:px-10 lg:py-14">
              <p className="text-[11px] font-black uppercase tracking-[0.28em]" style={{ color: accentColor }}>
                Stay
              </p>
              <h1 className="portal-title-display mt-4 font-semibold uppercase">{headline}</h1>
              <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-stone-300 sm:text-base">{message}</p>
              <div className="mt-8">{search}</div>
            </div>
            <div
              className="min-h-[16rem] bg-cover bg-center"
              style={{ backgroundImage: cssBackgroundUrl(hero) }}
              role="img"
              aria-label="Property photo"
            />
          </section>
        )
      }

      if (chrome.composition === 'royal') {
        return (
          <section key="hero" className="relative min-h-[32rem] overflow-hidden bg-[#1a1408]">
            <div
              className="portal-premium-photo absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(16,12,8,0.2), rgba(16,12,8,0.78)), ${cssBackgroundUrl(hero)}`,
              }}
              role="img"
              aria-label="Property photo"
            />
            <div className="portal-premium-rise relative z-[1] mx-auto flex min-h-[32rem] max-w-3xl flex-col items-center justify-end px-4 pb-8 text-center text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: accentColor }}>
                Crown Royal
              </p>
              <h1 className="portal-title-display mt-3 font-semibold">{headline}</h1>
              <div className="portal-premium-line my-4 h-px w-24" style={{ backgroundColor: accentColor }} />
              <p className="max-w-lg text-sm leading-relaxed text-white/85">{message}</p>
              <div className="portal-premium-card mt-6 w-full rounded-3xl border border-[#e8c872]/70 bg-white/95 p-4 text-left text-slate-900 shadow-2xl">
                {search}
              </div>
            </div>
          </section>
        )
      }

      if (chrome.composition === 'palace') {
        return (
          <section key="hero" className="portal-split bg-[#120e0a] text-white">
            <div className="portal-frame-photo relative min-h-72 overflow-hidden">
              <div
                className="portal-premium-photo absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: cssBackgroundUrl(hero) }}
                role="img"
                aria-label="Property photo"
              />
            </div>
            <div className="portal-premium-rise flex flex-col justify-center px-6 py-10 sm:px-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: accentColor }}>
                Palace
              </p>
              <h1 className="portal-title mt-3 font-semibold">{headline}</h1>
              <div className="portal-premium-line my-4 h-px w-16" style={{ backgroundColor: accentColor }} />
              <p className="max-w-md text-sm leading-relaxed text-white/75">{message}</p>
              <div className="portal-premium-card mt-6">{search}</div>
            </div>
          </section>
        )
      }

      if (chrome.composition === 'imperial') {
        return (
          <section key="hero" className="bg-[#fbf7ef] px-4 py-12 text-center">
            <div className="portal-premium-rise">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em]" style={{ color: primaryColor }}>
                Imperial
              </p>
              <h1 className="portal-title-display mx-auto mt-3 max-w-3xl font-semibold" style={{ color: primaryColor }}>
                {headline}
              </h1>
              <div className="portal-premium-line mx-auto my-5 h-px w-24" style={{ backgroundColor: accentColor }} />
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-stone-600">{message}</p>
            </div>
            <div className="portal-premium-frame mx-auto mt-8 max-w-4xl overflow-hidden border-4 p-2" style={{ borderColor: accentColor }}>
              <div className="portal-frame-photo relative h-64 overflow-hidden sm:h-80">
                <div
                  className="portal-premium-photo absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: cssBackgroundUrl(hero) }}
                  role="img"
                  aria-label="Property photo"
                />
              </div>
            </div>
            <div className="portal-premium-card mx-auto mt-8 max-w-3xl text-left">{search}</div>
          </section>
        )
      }

      if (chrome.composition === 'regent') {
        return (
          <section key="hero" className="relative min-h-[34rem] overflow-hidden bg-[#10243f]">
            <div
              className="portal-premium-photo absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(8,16,32,0.35), rgba(8,16,32,0.55)), ${cssBackgroundUrl(hero)}`,
              }}
              role="img"
              aria-label="Property photo"
            />
            <div className="portal-premium-rise relative z-[1] flex min-h-[34rem] flex-col items-center justify-center px-4 py-16 text-center text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: accentColor }}>
                Regent
              </p>
              <h1 className="portal-title-display mt-3 font-semibold">{headline}</h1>
              <div className="portal-premium-line my-4 h-px w-20" style={{ backgroundColor: accentColor }} />
              <p className="max-w-lg text-sm leading-relaxed text-white/85">{message}</p>
              <div className="portal-premium-frame mt-8 w-full max-w-4xl rounded-3xl border border-[#e8c872] bg-black/35 p-2 backdrop-blur-md">
                {search}
              </div>
            </div>
          </section>
        )
      }

      if (chrome.composition === 'sovereign') {
        return (
          <section key="hero" className="bg-[#0c0a09] px-4 py-14 text-center text-white">
            <div className="portal-premium-rise">
              <div className="portal-premium-line mx-auto h-px w-20" style={{ backgroundColor: accentColor }} />
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.36em]" style={{ color: accentColor }}>
                Sovereign
              </p>
              <h1 className="portal-title-display mx-auto mt-3 max-w-3xl font-semibold">{headline}</h1>
              <div className="portal-premium-line mx-auto my-4 h-px w-20" style={{ backgroundColor: accentColor }} />
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/70">{message}</p>
            </div>
            <div className="portal-premium-frame portal-frame-photo relative mx-auto mt-8 h-56 max-w-4xl overflow-hidden sm:h-72">
              <div
                className="portal-premium-photo absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: cssBackgroundUrl(hero) }}
                role="img"
                aria-label="Property photo"
              />
            </div>
            <div
              className="portal-premium-card mx-auto mt-8 max-w-3xl rounded-2xl border p-4 text-left"
              style={{ borderColor: accentColor }}
            >
              {search}
            </div>
          </section>
        )
      }

      if (chrome.composition === 'dynasty') {
        return (
          <section key="hero" className="bg-[#f8f1e7] px-4 py-10">
            <div className="portal-premium-frame mx-auto max-w-4xl overflow-hidden border-2 p-2" style={{ borderColor: accentColor }}>
              <div className="portal-frame-photo relative h-64 overflow-hidden sm:h-80">
                <div
                  className="portal-premium-photo absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: cssBackgroundUrl(hero) }}
                  role="img"
                  aria-label="Property photo"
                />
              </div>
            </div>
            <div className="portal-premium-rise mx-auto mt-8 max-w-3xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
                Dynasty
              </p>
              <h1 className="portal-title mt-2 font-semibold" style={{ color: primaryColor }}>
                {headline}
              </h1>
              <div className="portal-premium-line mx-auto my-4 h-px w-16" style={{ backgroundColor: accentColor }} />
              <p className="text-sm leading-relaxed text-stone-600">{message}</p>
            </div>
            <div className="portal-premium-card mx-auto mt-6 max-w-4xl">{search}</div>
          </section>
        )
      }

      if (chrome.composition === 'atrium') {
        return (
          <section key="hero">
            <div
              className="relative flex min-h-[26rem] items-end bg-cover bg-center"
              style={{
                backgroundColor: '#0b1f33',
                backgroundImage: `linear-gradient(to top, rgba(11,31,51,0.72), rgba(11,31,51,0.1)), ${cssBackgroundUrl(hero)}`,
              }}
            >
              <div className="w-full px-4 pb-10 pt-24 text-center text-white sm:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: accentColor }}>
                  Atrium
                </p>
                <h1 className="portal-title mt-3 font-semibold">{headline}</h1>
                <div className="mx-auto mt-4 h-px w-12" style={{ backgroundColor: accentColor }} />
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/85">{message}</p>
              </div>
            </div>
            <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8">{search}</div>
          </section>
        )
      }

      if (chrome.composition === 'concierge') {
        return (
          <section key="hero" className="portal-split portal-split-stretch">
            <div className="flex flex-col justify-center bg-[#f7f4ee] px-6 py-10 sm:px-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: primaryColor }}>
                Concierge
              </p>
              <h1 className="portal-title mt-3 font-semibold" style={{ color: primaryColor }}>
                {headline}
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600">{message}</p>
              <div className="mt-8">{search}</div>
            </div>
            <div
              className="min-h-[16rem] bg-cover bg-center"
              style={{ backgroundImage: cssBackgroundUrl(hero) }}
              role="img"
              aria-label="Property photo"
            />
          </section>
        )
      }

      if (chrome.composition === 'monument') {
        return (
          <section key="hero" className="portal-split bg-white px-4 py-10 sm:px-10">
            <div className="flex flex-col justify-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Direct</p>
              <h1 className="portal-title mt-3 font-semibold text-slate-900">{headline}</h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">{message}</p>
              <div className="mt-8">{search}</div>
            </div>
            <div
              className="portal-frame-photo w-full bg-cover bg-center ring-1 ring-slate-200"
              style={{ backgroundImage: cssBackgroundUrl(hero) }}
              role="img"
              aria-label="Property photo"
            />
          </section>
        )
      }

      if (chrome.composition === 'harbor') {
        return (
          <section key="hero">
            <div
              className="relative flex h-52 items-end bg-cover bg-center sm:h-72"
              style={{
                backgroundColor: '#0c2340',
                backgroundImage: `linear-gradient(to top, rgba(12,35,64,0.7), rgba(12,35,64,0.05)), ${cssBackgroundUrl(hero)}`,
              }}
            >
              <div className="px-4 pb-6 text-white sm:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: accentColor }}>
                  Harbor
                </p>
                <h1 className="portal-title mt-2 font-semibold">{headline}</h1>
              </div>
            </div>
            <div className="px-4 py-5 sm:px-8" style={{ backgroundColor: primaryColor }}>
              <p className="mb-4 max-w-xl text-sm leading-relaxed text-white/80">{message}</p>
              {search}
            </div>
          </section>
        )
      }

      if (chrome.composition === 'residence') {
        return (
          <section key="hero" className="bg-[#f7f3ee] px-4 py-10 sm:px-10">
            <div className="mx-auto max-w-5xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: primaryColor }}>
                Residence
              </p>
              <h1 className="portal-title mt-3 max-w-3xl font-semibold" style={{ color: primaryColor }}>
                {headline}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">{message}</p>
              <div
                className="portal-frame-photo mt-8 w-full bg-cover bg-center shadow-sm"
                style={{ backgroundImage: cssBackgroundUrl(hero) }}
                role="img"
                aria-label="Property photo"
              />
              <div className="mt-6 max-w-md">{search}</div>
            </div>
          </section>
        )
      }

      if (chrome.composition === 'ledger') {
        return (
          <section key="hero" className="border-y border-stone-200 bg-white">
            <div className="portal-split portal-split-stretch">
              <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">Direct booking</p>
                <h1 className="portal-title mt-3 font-semibold text-stone-900">{headline}</h1>
                <div className="mt-4 h-px w-10" style={{ backgroundColor: accentColor }} />
                <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-600">{message}</p>
                <div className="mt-8">{search}</div>
              </div>
              <div
                className="min-h-[16rem] border-stone-200 bg-cover bg-center sm:border-l"
                style={{ backgroundImage: cssBackgroundUrl(hero) }}
                role="img"
                aria-label="Property photo"
              />
            </div>
          </section>
        )
      }

      if (chrome.composition === 'luxe') {
        return (
          <section
            key="hero"
            className="portal-luxe-hero relative flex items-end"
            style={{
              backgroundColor: '#12304f',
              backgroundImage: `linear-gradient(to top, rgba(8,18,32,0.72), rgba(8,18,32,0.15)), ${cssBackgroundUrl(hero)}`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="w-full px-4 pb-8 pt-28 sm:px-8">
              <h1 className="portal-title text-center font-black text-white">{headline}</h1>
              <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-white/90 sm:text-base">{message}</p>
              <div className="mx-auto mt-8 w-full max-w-4xl rounded-[1.75rem] border border-white/50 bg-white/75 p-2 shadow-2xl backdrop-blur-md sm:p-3">
                {search}
              </div>
            </div>
          </section>
        )
      }

      if (chrome.composition === 'gallery') {
        return (
          <section key="hero" className="portal-split portal-split-stretch bg-white">
            <div
              className="min-h-[16rem] bg-cover bg-center"
              style={{ backgroundImage: cssBackgroundUrl(hero) }}
              role="img"
              aria-label="Property photo"
            />
            <div className="flex flex-col justify-center px-6 py-10 text-white sm:px-10" style={{ backgroundColor: primaryColor }}>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/70">Book direct</p>
              <h1 className="portal-title mt-3 font-black">{headline}</h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">{message}</p>
              <div className="mt-8">{search}</div>
            </div>
          </section>
        )
      }

      if (chrome.composition === 'ribbon') {
        return (
          <section key="hero" className="bg-[#f4f8f8] pb-8">
            <div
              className="h-56 bg-cover bg-center sm:h-72"
              style={{ backgroundImage: cssBackgroundUrl(hero) }}
              role="img"
              aria-label="Property photo"
            />
            <div className="portal-ribbon mx-4 rounded-[1.5rem] bg-white p-5 shadow-xl sm:mx-8 sm:p-6">
              <div className="min-w-0 flex-1">
                <h1 className="portal-title font-black" style={{ color: primaryColor }}>
                  {headline}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">{message}</p>
              </div>
              <div className="portal-ribbon-search w-full min-w-0">{search}</div>
            </div>
          </section>
        )
      }

      if (chrome.composition === 'sanctuary') {
        return (
          <section key="hero" className="bg-[#f6f0e8] px-4 py-8 sm:px-8 sm:py-10">
            <div
              className="portal-frame-photo mx-auto w-full max-w-5xl rounded-[2rem] bg-cover bg-center shadow-xl"
              style={{ backgroundImage: cssBackgroundUrl(hero) }}
              role="img"
              aria-label="Property photo"
            />
            <div className="mx-auto mt-8 max-w-xl text-center">
              <h1 className="portal-title font-black" style={{ color: primaryColor }}>
                {headline}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">{message}</p>
              <div className="mt-6 flex justify-center">{search}</div>
            </div>
          </section>
        )
      }

      if (chrome.composition === 'midnight') {
        return (
          <section
            key="hero"
            className="relative flex min-h-[32rem] items-center"
            style={{
              backgroundColor: '#09090b',
              backgroundImage: `linear-gradient(to bottom, rgba(9,9,11,0.55), rgba(9,9,11,0.82)), ${cssBackgroundUrl(hero)}`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.35em]" style={{ color: accentColor }}>
                After dark
              </p>
              <h1 className="portal-title mt-4 font-semibold text-white">{headline}</h1>
              <div className="mx-auto mt-5 h-px w-16" style={{ backgroundColor: accentColor }} />
              <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">{message}</p>
              <div className="mt-8 flex justify-center">{search}</div>
            </div>
          </section>
        )
      }

      return (
        <section
          key="hero"
          className={chrome.heroSection}
          style={{
            backgroundColor: '#0f172a',
            backgroundImage: `${chrome.heroOverlay}, ${cssBackgroundUrl(hero)}`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className={chrome.heroCopy}>
            <h1 className={`${chrome.heroTitle} portal-title`}>{headline}</h1>
            <p className={chrome.heroMessage}>{message}</p>
          </div>
          <div className={chrome.heroSearch}>{search}</div>
        </section>
      )
    }

    if (id === 'units') {
      const unitRows = dedupeGuestPortalListings(units)
      return (
        <section
          key="units"
          id="direct-portal-units"
          className={chrome.unitsSection}
        >
          <div className={chrome.sectionInner}>
            <h2 className={chrome.unitsTitle} style={{ color: headingColor }}>
              Available Accommodations
            </h2>
            <p className={chrome.unitsIntro}>
              {unitRows.length > 0
                ? 'Listed from your Configuration — nightly rates come from your rate calendar; when amounts differ, a low–high range is shown.'
                : 'Add listings under Configuration and set their status to Active to show them here.'}
            </p>
            {unitRows.length === 0 ? (
              <div className="mx-auto mt-8 max-w-md rounded-2xl border border-dashed border-slate-300 bg-white/80 px-5 py-10 text-center text-sm text-slate-600">
                No active accommodations yet. Open{' '}
                <span className="font-bold text-slate-800">Configuration → Units</span> to create listings.
              </div>
            ) : (
              <ul className={chrome.unitGrid}>
                {unitRows.map((unit, index) => (
                  <UnitListing
                    key={unit.uuid ?? unit.id}
                    composition={chrome.composition}
                    featured={chrome.composition === 'nature' && index === 0}
                    index={index}
                    unit={unit}
                    primaryColor={primaryColor}
                    priceOnCardColor={priceOnCardColor}
                    bookHref={typeof bookTo === 'function' && slug ? bookTo(unit.uuid ?? unit.id) : null}
                    LinkComponent={LinkComponent}
                    chrome={chrome}
                    accentColor={accentColor}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      )
    }

    if (id === 'amenities') {
      const items = Array.isArray(layout?.amenities) ? layout.amenities : []
      if (items.length === 0) {
        return null
      }
      return (
        <section key="amenities" className={chrome.band}>
          <div className={chrome.bandInner}>
            <h2 className={chrome.bandTitle} style={{ color: headingColor }}>
              Amenities
            </h2>
            <div className={chrome.amenityGrid}>
              {items.map((label) => (
                <div
                  key={label}
                  className={chrome.amenityChip}
                  style={{ color: primaryColor }}
                >
                  <span style={{ color: primaryColor }}>{amenityIconSvg(label)}</span>
                  <span className="leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )
    }

    if (id === 'reviews') {
      const reviews = Array.isArray(layout?.reviews) ? layout.reviews : []
      if (!showReviewsExtra || reviews.length === 0) {
        return null
      }
      return (
        <section key="reviews" className={chrome.band}>
          <div className={chrome.reviewInner}>
            <h2 className={chrome.bandTitle} style={{ color: headingColor }}>
              Guest Reviews
            </h2>
            <ul className={chrome.reviewList}>
              {reviews.map((r, idx) => (
                <li key={`${r.name}-${idx}`} className={chrome.reviewCard}>
                  {chrome.reviewQuoteFirst ? (
                    <>
                      <p className="text-lg font-medium leading-relaxed text-stone-800 sm:text-xl">&ldquo;{r.text}&rdquo;</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-700">{r.name}</p>
                        <StarRow count={r.rating} color={starOnCardColor} />
                      </div>
                    </>
                  ) : chrome.reviewAvatar ? (
                    <>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {(r.initial || r.name || '?').toString().charAt(0).toUpperCase()}
                          </div>
                          <p className={`min-w-0 text-sm font-black leading-snug ${chrome.composition === 'midnight' ? 'text-[#f6f1e6]' : 'text-[#0f3f73]'}`}>{r.name}</p>
                        </div>
                        <div className="shrink-0 sm:pt-0.5">
                          <StarRow count={r.rating} color={starOnCardColor} />
                        </div>
                      </div>
                      <p className={`mt-3 text-sm font-medium leading-relaxed ${chrome.composition === 'midnight' ? 'text-white/80' : 'text-[#0f3f73]'}`}>&ldquo;{r.text}&rdquo;</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                        <StarRow count={r.rating} color={starOnCardColor} />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">&ldquo;{r.text}&rdquo;</p>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )
    }

    if (id === 'contact') {
      const form = (
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <input type="text" readOnly placeholder="Your name" className={chrome.field} />
          <input type="email" readOnly placeholder="Email address" className={chrome.field} />
          <textarea readOnly rows={4} placeholder="Message..." className={`${chrome.field} resize-y`} />
          <button type="button" className={sendBtn.className} style={sendBtn.style}>
            Send Message
          </button>
        </form>
      )
      const map = showMap ? (
        <div className={chrome.map}>
          <div className="flex h-full min-h-40 w-full items-center justify-center">Map preview</div>
        </div>
      ) : null
      return (
        <section key="contact" className={chrome.band}>
          <div className={chrome.contactInner}>
            <h2 className={chrome.bandTitle} style={{ color: headingColor }}>
              Contact Us
            </h2>
            {chrome.contactSplit ? (
              <div className="portal-contact-split">
                {form}
                {map}
              </div>
            ) : (
              <div className="mt-6">
                {form}
                {map}
              </div>
            )}
            <p className={chrome.copyright}>
              © {year} {brand} · Powered by hofro
            </p>
          </div>
        </section>
      )
    }

    return null
  }

  return (
    <div className="portal-shell">
    <div data-template={templateId} className={`${chrome.page} portal-frame-page${embedded ? ' portal-embed' : ''}`}>
      <div className={`${chrome.shell} portal-frame-shell relative`}>
        {chrome.accentBar ? <div className="h-1.5 w-full" style={{ backgroundColor: primaryColor }} /> : null}
        <header
          className={`${chrome.header} ${centeredHeader ? '' : 'portal-header'} ${chrome.headerTone === 'float' ? 'portal-header-float' : ''}`}
          style={
            chrome.headerTone === 'float'
              ? { color: '#ffffff', backgroundColor: 'transparent' }
              : chrome.headerTone === 'inverse'
                ? { color: '#ffffff', backgroundColor: chrome.headerBg || '#1c1917' }
                : { color: primaryColor }
          }
        >
          <div className={chrome.brandWrap}>
            <span className={`${chrome.brand} break-words`}>{brand}</span>
            {(layout?.businessTagline ?? '').trim() ? (
              <p className={chrome.tagline}>{(layout.businessTagline ?? '').trim()}</p>
            ) : null}
          </div>
          <div className={`${chrome.navWrap} ${centeredHeader ? 'w-full flex-wrap' : 'portal-nav'}`}>
            {LinkComponent === 'span' ? (
              <span className={chrome.navPlaceholder}>hofros</span>
            ) : (
              <LinkComponent {...linkHomeProps} className={chrome.navLink}>
                hofros
              </LinkComponent>
            )}
            <button
              type="button"
              className={`${chrome.bookNow}${
                ['royal', 'palace', 'imperial', 'regent', 'sovereign', 'dynasty'].includes(chrome.composition)
                  ? ' portal-premium-book'
                  : ''
              }`}
              style={
                chrome.bookNowFill === 'primary'
                  ? { backgroundColor: primaryColor, color: '#ffffff' }
                  : { backgroundColor: accentColor }
              }
            >
              Book Now
            </button>
          </div>
          {chrome.headerTone === 'float' && (layout?.phone || layout?.email || layout?.address) ? (
            <p className="w-full text-center text-[11px] leading-relaxed text-white/80">
              {[layout?.phone, layout?.email, layout?.address].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </header>

        {chrome.headerTone !== 'float' && (layout?.phone || layout?.email || layout?.address) && (
          <div className={chrome.infoBar}>
            {[layout?.phone, layout?.email, layout?.address].filter(Boolean).join(' · ')}
          </div>
        )}

        {sectionOrder.map((sectionId) => renderSection(sectionId))}

        <footer className={chrome.footer}>
          {slug ? `/${slug}/directportal` : null}
          {slug ? ' · ' : null}
          Powered by hofro
        </footer>
      </div>

      {searchModalQuery ? (
        <PortalSearchResultsModal
          query={searchModalQuery}
          onClose={() => setSearchModalQuery(null)}
          units={units}
          primaryColor={primaryColor}
          slug={slug}
          bookTo={bookTo}
          LinkComponent={LinkComponent}
          priceOnCardColor={priceOnCardColor}
        />
      ) : null}
    </div>
    </div>
  )
}
