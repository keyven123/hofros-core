export function guestPortalCurrencySymbol(code) {
  const c = (code || '').toString().trim().toUpperCase()
  if (c === 'EUR') return '€'
  if (c === 'USD') return '$'
  if (c === 'GBP') return '£'
  if (c === 'PHP') return '₱'
  return c || ''
}

function toKeyPart(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
}

function toCount(v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function toNightly(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function listingSpecKey(unit) {
  return [
    toKeyPart(unit?.propertyName),
    toKeyPart(unit?.type),
    String(toCount(unit?.bedrooms)),
    String(toCount(unit?.beds)),
    String(toCount(unit?.maxGuests)),
  ].join('|')
}

/**
 * Collapse duplicate listing cards that describe the same accommodation specs.
 * Group key: accommodation (property) + unit type + bedrooms + beds + maxGuests.
 * Representative row prefers the lowest positive nightly price in a group.
 */
export function dedupeGuestPortalListings(units) {
  const list = Array.isArray(units) ? units : []
  const groups = new Map()
  for (const unit of list) {
    const key = listingSpecKey(unit)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(unit)
  }

  const out = []
  for (const rows of groups.values()) {
    const withPositive = rows
      .filter((u) => toNightly(u?.pricePerNight) > 0)
      .sort((a, b) => toNightly(a?.pricePerNight) - toNightly(b?.pricePerNight))
    const fallback = rows[0]
    out.push(withPositive[0] ?? fallback)
  }
  return out
}

export function formatGuestPortalUnitMeta(unit) {
  const parts = []
  if (unit?.propertyName && String(unit.propertyName).trim()) {
    parts.push(String(unit.propertyName).trim())
  }
  if (unit?.type && String(unit.type).trim()) {
    parts.push(String(unit.type).trim())
  }
  const g = Number(unit?.maxGuests)
  const guests = Number.isFinite(g) && g > 0 ? g : 0
  parts.push(`Max ${guests} ${guests === 1 ? 'guest' : 'guests'}`)
  return parts.join(' · ')
}

/** Bold card/booking headline: property (accommodation) name, or unit name if no property. */
export function guestPortalUnitListingTitle(unit) {
  const prop = typeof unit?.propertyName === 'string' ? unit.propertyName.trim() : ''
  if (prop) return prop
  const name = typeof unit?.name === 'string' ? unit.name.trim() : ''
  return name || 'Listing'
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Second line: type · bedrooms · beds · max guests (no room/unit name). */
export function formatGuestPortalUnitListingSubtitle(unit) {
  const parts = []
  if (unit?.type && String(unit.type).trim()) {
    parts.push(String(unit.type).trim())
  }
  const bedrooms = Number(unit?.bedrooms)
  if (Number.isFinite(bedrooms) && bedrooms > 0) {
    parts.push(pluralize(bedrooms, 'bedroom'))
  }
  const beds = Number(unit?.beds)
  if (Number.isFinite(beds) && beds > 0) {
    parts.push(pluralize(beds, 'bed'))
  }
  const g = Number(unit?.maxGuests)
  const guests = Number.isFinite(g) && g > 0 ? g : 0
  parts.push(`Max ${pluralize(guests, 'guest')}`)
  return parts.join(' · ')
}

function formatMoneyAmount(sym, n) {
  const formatted = Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : '0'
  return `${sym}${formatted}`
}

/** True when API exposes a nightly max above the min (rate intervals differ by weekday or override). */
export function guestPortalUnitHasNightlyPriceRange(unit) {
  const min = Number(unit?.pricePerNight)
  const maxRaw = unit?.pricePerNightMax
  const max = maxRaw === undefined || maxRaw === null ? min : Number(maxRaw)
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return false
  }
  return max - min > 0.004
}

/**
 * Nightly rate for portal cards: single `₱2,500/night` or range `₱2,500 – ₱3,000/night` when intervals vary.
 */
export function formatGuestPortalUnitNightlyDisplay(unit) {
  const sym = guestPortalCurrencySymbol(unit?.currency)
  const min = Number(unit?.pricePerNight)
  const maxRaw = unit?.pricePerNightMax
  const max = maxRaw === undefined || maxRaw === null ? min : Number(maxRaw)
  if (!Number.isFinite(min)) {
    return `${sym}0/night`
  }
  if (!Number.isFinite(max) || max - min <= 0.004) {
    return `${formatMoneyAmount(sym, min)}/night`
  }
  return `${formatMoneyAmount(sym, min)} – ${formatMoneyAmount(sym, max)}/night`
}

/** Lowest nightly only (used where a single anchor amount is needed). */
export function formatGuestPortalUnitPrice(unit) {
  const sym = guestPortalCurrencySymbol(unit?.currency)
  const n = Number(unit?.pricePerNight)
  const formatted = Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : '0'
  return `${sym}${formatted}/night`
}
