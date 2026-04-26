function parseHex(hex) {
  const s = (hex ?? '').toString().trim()
  if (!s) {
    return null
  }
  const normalized = s.startsWith('#') ? s : `#${s}`
  const m = /^#([0-9a-f]{6})$/i.exec(normalized)
  if (!m) {
    return null
  }
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** WCAG relative luminance (0–1). */
function relativeLuminance(hex) {
  const rgb = parseHex(hex)
  if (!rgb) {
    return 0.5
  }
  const linear = (c) => {
    const x = c / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  const r = linear(rgb.r)
  const g = linear(rgb.g)
  const b = linear(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const DEFAULT_PRIMARY = '#1B4F8A'

/**
 * Accent used for emphasis text on white/light cards. If accent is a pale tint
 * (high luminance), use primary so prices and similar stay readable.
 */
export function emphasisTextOnLightBg(accentColor, primaryColor) {
  const primary =
    typeof primaryColor === 'string' && primaryColor.trim() ? primaryColor.trim() : DEFAULT_PRIMARY
  const accent = typeof accentColor === 'string' && accentColor.trim() ? accentColor.trim() : '#F5A623'
  if (relativeLuminance(accent) > 0.72) {
    return primary
  }
  return accent
}

/** Star icons on white cards: keep gold tone when accent is too light for contrast. */
export function ratingStarColorOnLightBg(accentColor) {
  const accent = typeof accentColor === 'string' && accentColor.trim() ? accentColor.trim() : '#F5A623'
  if (relativeLuminance(accent) > 0.72) {
    return '#d97706'
  }
  return accent
}
