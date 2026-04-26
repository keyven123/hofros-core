/**
 * Half-open stay intervals [start, end) using YYYY-MM-D string comparison (valid for ISO dates).
 */
export function stayRangesOverlap(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false
  return startA < endB && startB < endA
}

/**
 * @param {string} checkInYmd
 * @param {string} checkOutYmd
 * @param {{ type: 'booking'|'block', start: string, end: string, label?: string }[]} ranges
 * @returns {string|null} user-facing message
 */
export function stayConflictMessage(checkInYmd, checkOutYmd, ranges) {
  if (!Array.isArray(ranges) || ranges.length === 0) return null
  for (const r of ranges) {
    if (!r?.start || !r?.end) continue
    if (stayRangesOverlap(checkInYmd, checkOutYmd, r.start, r.end)) {
      if (r.type === 'block') {
        const label = typeof r.label === 'string' && r.label.trim() ? r.label.trim() : 'Blocked'
        return `Selected dates overlap a block: ${label}.`
      }
      return 'Selected dates overlap an existing reservation for this unit.'
    }
  }
  return null
}

/**
 * @param {{ bookings?: object[], blocks?: object[] }} calendarUnit
 */
export function calendarUnitToRanges(calendarUnit) {
  if (!calendarUnit || typeof calendarUnit !== 'object') return []
  const out = []
  for (const b of calendarUnit.bookings || []) {
    if (b?.checkIn && b?.checkOut) {
      out.push({ type: 'booking', start: b.checkIn, end: b.checkOut, label: b.guestName })
    }
  }
  for (const k of calendarUnit.blocks || []) {
    if (k?.startDate && k?.endDate) {
      out.push({ type: 'block', start: k.startDate, end: k.endDate, label: k.label })
    }
  }
  return out
}
