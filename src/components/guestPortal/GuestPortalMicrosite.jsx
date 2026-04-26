import { useMemo, useState } from 'react'
import PortalSearchResultsModal from './PortalSearchResultsModal'
import { DEFAULT_HERO_BANNER_URL } from '../../data/heroBannerPresets'
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
import { contactSendButtonProps } from '../../utils/guestPortalThemeStyles'

function cssBackgroundUrl(imageUrl) {
  const u = (imageUrl ?? '').trim() || DEFAULT_HERO_BANNER_URL
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

function HeroGuestPill({ guests, onChange }) {
  return (
    <div className="relative flex h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-full border border-slate-200/90 bg-white px-3 shadow-sm sm:h-11 sm:w-[9.5rem] sm:min-w-[9.5rem] sm:shrink-0">
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

function HeroSearchBanner({ accentColor, primaryColor, slug, persistSearchIntent, onShowResults }) {
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

  return (
    <div className="w-full max-w-md rounded-full border border-white/45 bg-white/30 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.2)] backdrop-blur-md sm:w-fit sm:max-w-none sm:p-2">
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap sm:items-center sm:gap-2">
        <GuestPortalDateField
          variant="hero"
          ariaLabel="Check-in date"
          value={checkIn}
          onChange={handleCheckInChange}
          primaryColor={primaryColor}
          className="sm:w-[12.75rem] sm:min-w-[12.75rem] sm:max-w-[12.75rem] sm:shrink-0"
        />
        <GuestPortalDateField
          variant="hero"
          ariaLabel="Check-out date"
          value={checkOut}
          minYmd={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
          primaryColor={primaryColor}
          className="sm:w-[12.75rem] sm:min-w-[12.75rem] sm:max-w-[12.75rem] sm:shrink-0"
        />
        <HeroGuestPill guests={guests} onChange={setGuests} />
        <button
          type="button"
          className="flex h-11 w-full shrink-0 items-center justify-center rounded-full px-9 text-sm font-black text-[#0f3f73] shadow-sm transition hover:brightness-[1.02] sm:w-auto sm:px-10"
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
}) {
  const brand = (layout?.businessName ?? '').trim() || merchantNameFallback || 'My Hotel'
  const hero = (heroImageUrl ?? '').trim() || DEFAULT_HERO_BANNER_URL
  const year = new Date().getFullYear()
  const vis = layout?.sectionVisibility ?? {}
  const order = Array.isArray(layout?.sectionOrder) ? layout.sectionOrder : []
  const showReviewsExtra = layout?.showReviews !== false
  const showMap = layout?.showMap !== false
  const sendBtn = contactSendButtonProps(themePreset, primaryColor)
  const priceOnCardColor = emphasisTextOnLightBg(accentColor, primaryColor)
  const starOnCardColor = ratingStarColorOnLightBg(accentColor)
  const [searchModalQuery, setSearchModalQuery] = useState(null)

  function renderSection(id) {
    if (!vis[id]) {
      return null
    }

    if (id === 'hero') {
      return (
        <section
          key="hero"
          className="relative min-h-[min(52dvh,26rem)] overflow-hidden px-4 pb-10 pt-12 text-center sm:min-h-[min(64dvh,34rem)] sm:px-6 sm:pb-14 sm:pt-16 md:min-h-[min(70dvh,36rem)] md:px-10 md:pb-16 md:pt-20"
          style={{
            backgroundColor: '#0f172a',
            backgroundImage: `linear-gradient(to bottom, rgba(12,45,90,0.45), rgba(15,23,42,0.82)), ${cssBackgroundUrl(hero)}`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="relative z-[1] mx-auto w-full max-w-2xl px-1 sm:px-0">
            <h1 className="text-[clamp(1.5rem,5vw+0.5rem,2.5rem)] font-black leading-tight tracking-tight text-white text-balance drop-shadow-md">
              {headline}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-sm font-medium leading-relaxed text-white/95 drop-shadow sm:mt-4 sm:text-base">
              {message}
            </p>
          </div>
          <div className="relative z-[1] mx-auto mt-8 flex w-full justify-center px-1 sm:mt-10 sm:px-0 md:mt-12">
            <HeroSearchBanner
              accentColor={accentColor}
              primaryColor={primaryColor}
              slug={slug}
              persistSearchIntent={Boolean(typeof bookTo === 'function' && slug)}
              onShowResults={(q) => setSearchModalQuery(q)}
            />
          </div>
        </section>
      )
    }

    if (id === 'units') {
      const unitRows = dedupeGuestPortalListings(units)
      return (
        <section
          key="units"
          id="direct-portal-units"
          className="scroll-mt-4 border-t border-slate-200 bg-slate-50 px-4 py-8 sm:scroll-mt-6 sm:px-6 sm:py-10 lg:px-10"
        >
          <div className="mx-auto w-full max-w-6xl">
            <h2
              className="text-center text-xl font-black tracking-tight text-[#0f3f73] sm:text-2xl"
              style={{ color: primaryColor }}
            >
              Available Accommodations
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-xs leading-relaxed text-slate-500 sm:text-sm">
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
              <ul className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {unitRows.map((unit) => {
                  const bookHref = typeof bookTo === 'function' && slug ? bookTo(unit.id) : null
                  const useBookLink = Boolean(bookHref) && LinkComponent !== 'span'
                  const BookTag = useBookLink ? LinkComponent : 'button'
                  const bookProps = useBookLink
                    ? LinkComponent === 'a'
                      ? { href: bookHref }
                      : { to: bookHref }
                    : { type: 'button' }
                  return (
                    <li
                      key={unit.id}
                      className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5"
                    >
                      <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow-inner"
                            style={{ backgroundColor: primaryColor }}
                          >
                            ⌂
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold leading-snug text-slate-900">{guestPortalUnitListingTitle(unit)}</p>
                            <p className="mt-0.5 text-xs leading-snug text-slate-500">{formatGuestPortalUnitListingSubtitle(unit)}</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-black tabular-nums" style={{ color: priceOnCardColor }}>
                          {guestPortalUnitHasNightlyPriceRange(unit) ? '' : 'From '}
                          {formatGuestPortalUnitNightlyDisplay(unit)}
                        </span>
                      </div>
                      <BookTag
                        {...bookProps}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-xl py-2.5 text-center text-xs font-black text-white no-underline transition hover:opacity-95"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Book
                      </BookTag>
                    </li>
                  )
                })}
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
        <section key="amenities" className="border-t border-slate-200 bg-[#e8f2fc] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <div className="mx-auto w-full max-w-3xl md:max-w-4xl">
            <h2 className="text-center text-lg font-black sm:text-xl" style={{ color: primaryColor }}>
              Amenities
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {items.map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50/90 px-3 py-3 text-sm font-bold shadow-sm"
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
        <section key="reviews" className="border-t border-slate-200 bg-[#e8f2fc] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <div className="mx-auto w-full max-w-2xl md:max-w-3xl">
            <h2 className="text-center text-lg font-black sm:text-xl" style={{ color: primaryColor }}>
              Guest Reviews
            </h2>
            <ul className="mt-6 space-y-4">
              {reviews.map((r, idx) => (
                <li key={`${r.name}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {(r.initial || r.name || '?').toString().charAt(0).toUpperCase()}
                      </div>
                      <p className="min-w-0 text-sm font-black leading-snug text-[#0f3f73]">{r.name}</p>
                    </div>
                    <div className="shrink-0 sm:pt-0.5">
                      <StarRow count={r.rating} color={starOnCardColor} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-[#0f3f73]">&ldquo;{r.text}&rdquo;</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )
    }

    if (id === 'contact') {
      return (
        <section key="contact" className="border-t border-slate-200 bg-[#e8f2fc] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <div className="mx-auto w-full max-w-md">
            <h2 className="text-center text-lg font-black text-[#0f3f73]">Contact Us</h2>
            <form className="mt-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                readOnly
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"
              />
              <input
                type="email"
                readOnly
                placeholder="Email address"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"
              />
              <textarea
                readOnly
                rows={4}
                placeholder="Message..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"
              />
              <button type="button" className={sendBtn.className} style={sendBtn.style}>
                Send Message
              </button>
            </form>
            {showMap && (
              <div className="mt-6 h-40 w-full rounded-xl border border-slate-200 bg-slate-200/80 text-center text-xs text-slate-500">
                <div className="flex h-full items-center justify-center">Map preview</div>
              </div>
            )}
            <p className="mt-6 text-center text-xs text-slate-500">
              © {year} {brand} · Powered by hofro
            </p>
          </div>
        </section>
      )
    }

    return null
  }

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-b from-slate-200/95 via-slate-100 to-slate-200/85 text-slate-900 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] [padding-left:max(0px,env(safe-area-inset-left))] [padding-right:max(0px,env(safe-area-inset-right))] [padding-top:max(0px,env(safe-area-inset-top))] sm:min-h-screen sm:px-3 sm:py-4 md:px-5 md:py-5">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-full flex-col overflow-hidden bg-white shadow-none ring-0 sm:min-h-[calc(100vh-2rem)] sm:max-w-[min(90rem,calc(100vw-1.5rem))] sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-slate-900/[0.06] md:max-w-[min(90rem,calc(100vw-2.5rem))] lg:max-w-[min(92rem,calc(100vw-3rem))]">
        <header
          className="flex flex-col gap-4 border-b border-slate-200/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6 sm:py-4 lg:px-8"
          style={{ color: primaryColor }}
        >
          <div className="min-w-0 sm:pr-3">
            <span className="block text-pretty text-lg font-black leading-tight tracking-tight sm:text-xl">{brand}</span>
            {(layout?.businessTagline ?? '').trim() ? (
              <p className="mt-1 text-pretty text-xs font-medium leading-snug text-slate-500 sm:text-sm">
                {(layout.businessTagline ?? '').trim()}
              </p>
            ) : null}
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            {LinkComponent === 'span' ? (
              <span className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-400 sm:flex-none sm:px-3">
                hofros
              </span>
            ) : (
              <LinkComponent
                {...linkHomeProps}
                className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-center text-xs font-bold text-slate-600 transition hover:bg-slate-50 sm:flex-none sm:px-3"
              >
                hofros
              </LinkComponent>
            )}
            <button
              type="button"
              className="flex-1 rounded-lg px-4 py-2.5 text-xs font-black text-[#0f3f73] shadow-sm transition hover:brightness-105 sm:flex-none sm:py-2"
              style={{ backgroundColor: accentColor }}
            >
              Book Now
            </button>
          </div>
        </header>

        {(layout?.phone || layout?.email || layout?.address) && (
          <div className="break-words border-b border-slate-100 bg-slate-50/90 px-4 py-2.5 text-center text-[11px] leading-relaxed text-slate-600 sm:px-6 sm:text-xs lg:px-8">
            {[layout?.phone, layout?.email, layout?.address].filter(Boolean).join(' · ')}
          </div>
        )}

        {order.map((id) => renderSection(id))}

        <footer className="mt-auto border-t border-slate-100 bg-slate-50/90 px-4 py-4 text-center text-[11px] text-slate-500 sm:px-6 lg:px-8">
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
  )
}
