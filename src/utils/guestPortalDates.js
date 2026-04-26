/** Local calendar date as YYYY-MM-DD (no UTC shift). */
export function toYmdLocal(d) {
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Check-in today, check-out tomorrow — used across direct portal booking UI. */
export function defaultStayDatesFromToday() {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { checkIn: toYmdLocal(start), checkOut: toYmdLocal(end) }
}

export function ymdToDdMmYyyy(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    return '—'
  }
  const [y, m, d] = ymd.split('-')
  return `${d}/${m}/${y}`
}

/** @param {string} ymd */
export function addDaysToYmd(ymd, days) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    return ymd
  }
  const [y, mo, d] = ymd.split('-').map(Number)
  const dt = new Date(y, mo - 1, d)
  dt.setDate(dt.getDate() + days)
  return toYmdLocal(dt)
}
