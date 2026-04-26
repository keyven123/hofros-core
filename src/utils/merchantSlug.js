/**
 * URL segment for `/[slug]/directportal` — stable, shareable, lowercase.
 */
export function slugFromMerchantName(name) {
  const raw = (name ?? '').trim().toLowerCase()
  const ascii = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii || 'merchant'
}

/** Friendly label derived from slug when no API name is available. */
export function displayNameFromSlug(slug) {
  const parts = (slug ?? '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  return parts.length ? parts.join(' ') : 'This property'
}
