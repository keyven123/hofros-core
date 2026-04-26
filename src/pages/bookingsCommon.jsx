import { guestPortalCurrencySymbol } from '../utils/formatGuestPortalUnit'

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const SOURCE_LABELS = {
  direct_portal: 'Direct',
  manual: 'Manual',
  airbnb: 'Airbnb',
  booking_com: 'Booking.com',
  expedia: 'Expedia',
  vrbo: 'VRBO',
}

export function statusBadgeClass(status) {
  if (status === 'cancelled') {
    return 'bg-rose-100 text-rose-800 ring-rose-200'
  }
  if (status === 'assigned') {
    return 'bg-emerald-100 text-emerald-800 ring-emerald-200'
  }
  if (status === 'checked_in') {
    return 'bg-violet-100 text-violet-800 ring-violet-200'
  }
  if (status === 'checked_out') {
    return 'bg-slate-200 text-slate-800 ring-slate-300'
  }
  if (status === 'accepted') {
    return 'bg-sky-100 text-sky-800 ring-sky-200'
  }
  if (status === 'pending') {
    return 'bg-amber-100 text-amber-800 ring-amber-200'
  }
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

export function statusLabel(status) {
  const row = STATUS_OPTIONS.find((s) => s.value === status)
  return row?.label ?? status
}

export function sourceLabel(key) {
  if (!key) return '—'
  return SOURCE_LABELS[key] ?? key.replace(/_/g, ' ')
}

export function formatYmdToDisplay(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '—'
  const d = new Date(`${ymd}T12:00:00`)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatMoney(amount, currency) {
  const sym = guestPortalCurrencySymbol(currency)
  const n = Number(amount)
  const formatted = Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : '0'
  return `${sym}${formatted}`
}

export function specDisplay(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  return String(value)
}

export function DetailRow({ label, value, inGrid = false, className = '' }) {
  const base =
    'flex flex-col gap-0.5 border-b border-slate-100 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4'
  const padding = inGrid ? 'py-2.5' : 'py-3 last:border-0'

  return (
    <div className={`${base} ${padding} ${className}`.trim()}>
      <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="min-w-0 text-sm font-semibold text-slate-900 sm:text-right">{value}</span>
    </div>
  )
}
