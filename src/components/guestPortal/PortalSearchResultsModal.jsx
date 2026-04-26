import { useEffect, useMemo } from 'react'
import { ymdToDdMmYyyy } from '../../utils/guestPortalDates'
import { filterUnitsForPortalSearch } from '../../utils/guestPortalUnitSearch'
import {
  dedupeGuestPortalListings,
  formatGuestPortalUnitListingSubtitle,
  formatGuestPortalUnitNightlyDisplay,
  guestPortalUnitHasNightlyPriceRange,
  guestPortalUnitListingTitle,
} from '../../utils/formatGuestPortalUnit'

export default function PortalSearchResultsModal({
  onClose,
  query,
  units,
  primaryColor,
  slug,
  bookTo,
  LinkComponent = 'a',
  priceOnCardColor,
}) {
  const matched = useMemo(() => {
    if (!query) {
      return []
    }
    return dedupeGuestPortalListings(filterUnitsForPortalSearch(units, query))
  }, [query, units])

  useEffect(() => {
    if (!query) {
      return undefined
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [query, onClose])

  if (!query) {
    return null
  }

  const { checkIn, checkOut, guests } = query
  const g = Math.min(16, Math.max(1, Number(guests) || 1))

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-search-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="portal-search-modal-title" className="text-lg font-black text-slate-900">
              Matching accommodations
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {ymdToDdMmYyyy(checkIn)} → {ymdToDdMmYyyy(checkOut)} · {g} {g === 1 ? 'guest' : 'guests'} · max capacity
              and weekly schedule must allow every night of your stay.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-sm font-bold text-slate-600 hover:bg-slate-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {matched.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
              No listings match these dates and guest count. Try different dates, fewer guests, or check each
              listing’s weekly schedule in Configuration.
            </div>
          ) : (
            <ul className="space-y-3">
              {matched.map((unit) => {
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
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{guestPortalUnitListingTitle(unit)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatGuestPortalUnitListingSubtitle(unit)}</p>
                      <p className="mt-1 text-sm font-black tabular-nums" style={{ color: priceOnCardColor }}>
                        {guestPortalUnitHasNightlyPriceRange(unit) ? '' : 'From '}
                        {formatGuestPortalUnitNightlyDisplay(unit)}
                      </p>
                    </div>
                    <BookTag
                      {...bookProps}
                      {...(useBookLink ? { onClick: () => onClose() } : {})}
                      className="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-xs font-black text-white no-underline transition hover:opacity-95 sm:min-w-[6.5rem]"
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

        <div className="shrink-0 border-t border-slate-100 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border-2 border-slate-200 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
