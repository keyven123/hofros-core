const PORTAL_SEARCH_STORAGE_KEY = 'hofro.directPortal.search.v1'

/**
 * Persist hero “Search” choices so the booking page can pre-fill dates & guest count.
 * @param {{ slug: string, checkIn: string, checkOut: string, guests: number }} payload
 */
export function savePortalSearchIntent(payload) {
  try {
    const { slug, checkIn, checkOut, guests } = payload
    if (!slug || !checkIn || !checkOut) return
    sessionStorage.setItem(
      PORTAL_SEARCH_STORAGE_KEY,
      JSON.stringify({
        slug: String(slug),
        checkIn: String(checkIn),
        checkOut: String(checkOut),
        guests: Math.min(16, Math.max(1, Number(guests) || 1)),
      }),
    )
  } catch {
    /* private mode / quota */
  }
}

/**
 * Read intent for this merchant slug without removing it (for inspection).
 * @returns {{ slug: string, checkIn: string, checkOut: string, guests: number } | null}
 */
export function peekPortalSearchIntent(expectedSlug) {
  if (!expectedSlug) return null
  try {
    const raw = sessionStorage.getItem(PORTAL_SEARCH_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    if (String(data.slug) !== String(expectedSlug)) return null
    return {
      slug: String(data.slug),
      checkIn: String(data.checkIn ?? ''),
      checkOut: String(data.checkOut ?? ''),
      guests: Math.min(16, Math.max(1, Number(data.guests) || 1)),
    }
  } catch {
    return null
  }
}

export function clearPortalSearchIntent() {
  try {
    sessionStorage.removeItem(PORTAL_SEARCH_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
