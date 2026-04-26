const WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function defaultPortalWeekSchedule() {
  return { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true }
}

/** Merge API week flags; missing days default to open. */
export function normalizePortalWeekSchedule(raw) {
  const next = defaultPortalWeekSchedule()
  if (!raw || typeof raw !== 'object') {
    return next
  }
  for (const k of Object.keys(next)) {
    if (typeof raw[k] === 'boolean') {
      next[k] = raw[k]
    }
  }
  return next
}

function toYmdLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Each calendar night of the stay (check-in evening through night before check-out).
 * @returns {string[]} YYYY-MM-DD
 */
export function stayNightYmds(checkInYmd, checkOutYmd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOutYmd)) {
    return []
  }
  if (checkOutYmd <= checkInYmd) {
    return []
  }
  const [y0, m0, d0] = checkInYmd.split('-').map(Number)
  const [y1, m1, d1] = checkOutYmd.split('-').map(Number)
  const nights = []
  const cur = new Date(y0, m0 - 1, d0)
  const end = new Date(y1, m1 - 1, d1)
  while (cur < end) {
    nights.push(toYmdLocalDate(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return nights
}

function ymdToWeekKey(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return WEEK_KEYS[dt.getDay()]
}

/**
 * @param {object} unit — portal unit with maxGuests, weekSchedule
 * @param {{ checkIn: string, checkOut: string, guests: number }} params
 */
export function unitMatchesPortalSearch(unit, params) {
  const guests = Math.min(16, Math.max(1, Number(params?.guests) || 1))
  const checkIn = params?.checkIn
  const checkOut = params?.checkOut
  const maxG = Number(unit?.maxGuests)
  if (!Number.isFinite(maxG) || maxG < guests) {
    return false
  }
  const nights = stayNightYmds(checkIn, checkOut)
  if (nights.length === 0) {
    return false
  }
  const ws = normalizePortalWeekSchedule(unit?.weekSchedule)
  for (const ymd of nights) {
    const key = ymdToWeekKey(ymd)
    if (ws[key] !== true) {
      return false
    }
  }
  return true
}

export function filterUnitsForPortalSearch(units, params) {
  const list = Array.isArray(units) ? units : []
  return list.filter((u) => unitMatchesPortalSearch(u, params))
}
