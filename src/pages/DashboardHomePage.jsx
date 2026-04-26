import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiFetch } from '../utils/api'
import { formatMoney } from './bookingsCommon'

function todayYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDaysYmd(ymd, delta) {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + delta)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatHeaderLong(ymd) {
  if (!ymd) return '—'
  const d = new Date(`${ymd}T12:00:00`)
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatOutlookCenter(ymd) {
  if (!ymd) return '—'
  const d = new Date(`${ymd}T12:00:00`)
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
  const dayOrd = ordinal(d.getDate())
  const year = d.getFullYear()
  return `${month} ${dayOrd}, ${year}`
}

function formatDmY(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '—'
  const [y, m, day] = ymd.split('-')
  return `${day}/${m}/${y}`
}

function telHref(phone) {
  if (phone == null || String(phone).trim() === '') return ''
  const cleaned = String(phone).replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : ''
}

const NEW_BOOKING_BANNER_KEY = 'hofro_dash_newbook_banner'

function newBookingsStatusPillClass(status) {
  if (status === 'Pending') return 'bg-teal-50 text-teal-700'
  if (status === 'Accepted') return 'bg-sky-50 text-sky-800'
  if (status === 'Assigned') return 'bg-emerald-50 text-emerald-800'
  if (status === 'Cancelled') return 'bg-rose-50 text-rose-700'
  if (status === 'New booking') return 'bg-teal-50 text-teal-700'
  return 'bg-slate-100 text-slate-700'
}

function DonutProgress({ pct, size = 76 }) {
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, pct))
  const offset = c - (p / 100) * c
  const cx = size / 2
  const cy = size / 2

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8eef7" strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#2B5AED"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconNewBooking({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M9 12h6M12 9v6" strokeLinecap="round" />
      <rect x="5" y="4" width="14" height="16" rx="2" strokeLinejoin="round" />
      <path d="M8 2v4M16 2v4" strokeLinecap="round" />
    </svg>
  )
}

function IconBell({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M14 8a4 4 0 1 0-4 0c0 5-3 6-3 6h10s-3-1-3-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.3 20a1.7 1.7 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  )
}

function IconExit({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M10 7H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4M15 15l3-3-3-3M8 12h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPrint({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M7 16v4h10v-4M7 12V6h10v6" strokeLinejoin="round" />
      <path d="M6 12H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" strokeLinejoin="round" />
    </svg>
  )
}

function IconPhone({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path
        d="M15.6 14.5c-1.3 1.3-3.8 1.2-5.6-.6l-.3-.3c-1.8-1.8-1.9-4.3-.6-5.6l1-1c.4-.4.5-1 .2-1.5L9 3.8c-.3-.6-1-1-1.7-.9-2.5.2-4.6 2.3-4.8 4.8-.2 2.8 1 5.6 3.2 7.8s5 3.4 7.8 3.2c2.5-.2 4.6-2.3 4.8-4.8.1-.7-.3-1.4-.9-1.7l-1.6-.8c-.5-.3-1.1-.2-1.5.2l-1 1Z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconRefresh({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-9 9 4.5 4.5 0 0 1-4.12-2.7M3 12a9 9 0 0 1 9-9 4.5 4.5 0 0 1 4.12 2.7M3 12h4m14 0h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCalendar({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" strokeLinejoin="round" />
      <path d="M8 3v4M16 3v4M4 11h16" strokeLinecap="round" />
    </svg>
  )
}

function IconChevron({ dir, className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {dir === 'left' ? <path d="M14 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {dir === 'right' ? <path d="M10 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </svg>
  )
}

const RES_TABS = [
  { id: 'newToday', label: 'New bookings' },
  { id: 'arrivals', label: 'Arrivals' },
  { id: 'departures', label: 'Departures' },
  { id: 'stayovers', label: 'Stayovers' },
  { id: 'inHouse', label: 'In-House Guests' },
]

const ACTIVITY_TABS = [
  { id: 'sales', label: 'Sales' },
  { id: 'cancellations', label: 'Cancellations' },
  { id: 'overbookings', label: 'Overbookings' },
]

const emptyDashboard = {
  date: todayYmd(),
  currency: 'PHP',
  kpis: {
    newlyBookedToday: 0,
    arrivals: 0,
    departures: 0,
    accommodationsBooked: 0,
    accommodationsBookedPct: 0,
    totalActiveUnits: 0,
  },
  reservations: {
    arrivals: { today: [], tomorrow: [] },
    departures: { today: [], tomorrow: [] },
    stayovers: { today: [], tomorrow: [] },
    inHouse: { today: [], tomorrow: [] },
    newToday: { rows: [] },
  },
  todayActivity: {
    sales: { bookedTodayCount: 0, roomNights: 0, revenue: 0, rows: [] },
    cancellations: { rows: [] },
    overbookings: { rows: [] },
  },
  outlook: {
    startDate: todayYmd(),
    endDate: todayYmd(),
    occupancyPct14d: 0,
    revenue14d: 0,
    days: [],
  },
}

export default function DashboardHomePage() {
  const navigate = useNavigate()
  const reservationsPanelRef = useRef(null)
  const [data, setData] = useState(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [outlookStart, setOutlookStart] = useState(() => todayYmd())
  const [newBookingBannerDismissed, setNewBookingBannerDismissed] = useState(false)

  const [resTab, setResTab] = useState('newToday')
  const [resDay, setResDay] = useState('today')
  const [resSearch, setResSearch] = useState('')
  const [activityTab, setActivityTab] = useState('sales')
  const [outlookMode, setOutlookMode] = useState('bookedBlocked')

  const loadDashboard = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      qs.set('outlookStart', outlookStart)
      const payload = await apiFetch(`/v1/dashboard?${qs.toString()}`)
      setData({
        date: payload?.date ?? todayYmd(),
        currency: payload?.currency ?? 'PHP',
        kpis: { ...emptyDashboard.kpis, ...payload?.kpis },
        reservations: {
          ...emptyDashboard.reservations,
          ...payload?.reservations,
        },
        todayActivity: {
          sales: { ...emptyDashboard.todayActivity.sales, ...payload?.todayActivity?.sales },
          cancellations: {
            rows: Array.isArray(payload?.todayActivity?.cancellations?.rows)
              ? payload.todayActivity.cancellations.rows
              : [],
          },
          overbookings: {
            rows: Array.isArray(payload?.todayActivity?.overbookings?.rows)
              ? payload.todayActivity.overbookings.rows
              : [],
          },
        },
        outlook: { ...emptyDashboard.outlook, ...payload?.outlook },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [outlookStart])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const newlyBookedCount = data.kpis.newlyBookedToday ?? 0

  const pendingNewBookingsCount = useMemo(() => {
    const rows = Array.isArray(data.reservations?.newToday?.rows) ? data.reservations.newToday.rows : []
    return rows.filter((r) => r.status === 'Pending').length
  }, [data.reservations?.newToday?.rows])

  /** Notification uses pending count only; KPI card still shows all new bookings today (pending + accepted + assigned). */
  const newBookingBannerToken = `${data.date}:pending:${pendingNewBookingsCount}`

  useEffect(() => {
    if (pendingNewBookingsCount <= 0) {
      setNewBookingBannerDismissed(true)
      return
    }
    try {
      setNewBookingBannerDismissed(sessionStorage.getItem(NEW_BOOKING_BANNER_KEY) === newBookingBannerToken)
    } catch {
      setNewBookingBannerDismissed(false)
    }
  }, [newBookingBannerToken, pendingNewBookingsCount])

  function dismissNewBookingBanner() {
    try {
      sessionStorage.setItem(NEW_BOOKING_BANNER_KEY, newBookingBannerToken)
    } catch {
      // ignore
    }
    setNewBookingBannerDismissed(true)
  }

  function goToNewBookingsTab() {
    setResTab('newToday')
    window.requestAnimationFrame(() => {
      reservationsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const reservationRows = useMemo(() => {
    if (resTab === 'newToday') {
      const rows = Array.isArray(data.reservations?.newToday?.rows) ? data.reservations.newToday.rows : []
      const q = resSearch.trim().toLowerCase()
      if (!q) return rows
      return rows.filter((r) => String(r.guestName ?? '').toLowerCase().includes(q))
    }
    const bucket = data.reservations?.[resTab] ?? { today: [], tomorrow: [] }
    const rows = bucket[resDay] ?? []
    const q = resSearch.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => String(r.guestName ?? '').toLowerCase().includes(q))
  }, [data.reservations, resTab, resDay, resSearch])

  const chartPoints = useMemo(() => {
    const days = Array.isArray(data.outlook?.days) ? data.outlook.days : []
    return days.map((d) => ({
      ...d,
      label: `${d.weekdayShort} ${d.dayOfMonth}`,
      chartValue: outlookMode === 'bookedBlocked' ? d.bookedBlockedPct : d.availabilityPct,
    }))
  }, [data.outlook?.days, outlookMode])

  const sales = data.todayActivity?.sales ?? emptyDashboard.todayActivity.sales
  const currency = data.currency || 'PHP'

  const activityRows = useMemo(() => {
    if (activityTab === 'sales') {
      return (sales.rows ?? []).map((r) => ({
        key: `s-${r.bookingId}`,
        guest: r.guestName,
        revenue: formatMoney(r.revenue, r.currency || currency),
        checkIn: formatDmY(r.checkIn),
        nights: r.nights,
        bookingId: r.bookingId,
      }))
    }
    if (activityTab === 'cancellations') {
      return (data.todayActivity?.cancellations?.rows ?? []).map((r) => ({
        key: `c-${r.bookingId}`,
        guest: r.guestName,
        revenue: formatMoney(r.revenue, r.currency || currency),
        checkIn: formatDmY(r.checkIn),
        nights: r.nights,
        bookingId: r.bookingId,
      }))
    }
    return (data.todayActivity?.overbookings?.rows ?? []).map((r, i) => ({
      key: `o-${i}-${r.bookingIdA}`,
      guest: r.guestName,
      revenue: '—',
      checkIn: formatDmY(r.checkIn),
      nights: '—',
      bookingId: r.bookingIdA,
    }))
  }, [activityTab, sales.rows, data.todayActivity, currency])

  return (
    <div className="min-h-full bg-[#eef3fb] p-4 pb-10 print:bg-white">
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-800">{formatHeaderLong(data.date)}</h1>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 shadow-sm hover:bg-slate-50"
            title="Coming soon"
          >
            Switch to new
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Print"
          >
            <IconPrint className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            aria-label="Refresh"
            disabled={loading}
          >
            <IconRefresh className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/bookings?new=1')}
            className="rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-teal-600"
          >
            Create new reservation
          </button>
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 print:hidden">
          {error}
        </p>
      ) : null}

      {!loading &&
      pendingNewBookingsCount > 0 &&
      !newBookingBannerDismissed &&
      !error ? (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 shadow-sm print:hidden"
          role="status"
        >
          <p className="font-semibold">
            <span className="font-black text-teal-800">{pendingNewBookingsCount}</span>{' '}
            {pendingNewBookingsCount === 1
              ? 'pending reservation from today awaits acceptance or assignment.'
              : 'pending reservations from today await acceptance or assignment.'}{' '}
            Arrivals are check-ins today only.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                dismissNewBookingBanner()
                goToNewBookingsTab()
              }}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white hover:bg-teal-700"
            >
              View new bookings
            </button>
            <button
              type="button"
              onClick={dismissNewBookingBanner}
              className="rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
        <button
          type="button"
          onClick={goToNewBookingsTab}
          className="rounded-xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Newly booked</p>
              <p className="mt-2 text-3xl font-black text-violet-600">{loading ? '—' : newlyBookedCount}</p>
              <p className="mt-1 text-xs text-slate-500">Pending, accepted, or assigned · created today</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-600">
              <IconNewBooking className="h-6 w-6" />
            </div>
          </div>
        </button>
        <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Arrivals</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">{loading ? '—' : data.kpis.arrivals}</p>
              <p className="mt-1 text-xs text-slate-500">Check-in today</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <IconBell className="h-6 w-6" />
            </div>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Departures</p>
              <p className="mt-2 text-3xl font-black text-amber-600">{loading ? '—' : data.kpis.departures}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <IconExit className="h-6 w-6" />
            </div>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Accommodations booked</p>
              <p className="mt-2 text-3xl font-black text-[#2B5AED]">{loading ? '—' : data.kpis.accommodationsBooked}</p>
              <p className="mt-1 text-xs text-slate-500">
                {data.kpis.totalActiveUnits ? `${data.kpis.accommodationsBookedPct}% of ${data.kpis.totalActiveUnits} units` : 'No active units'}
              </p>
            </div>
            <div className="relative flex h-[76px] w-[76px] items-center justify-center">
              <DonutProgress pct={data.kpis.accommodationsBookedPct} />
              <span className="pointer-events-none absolute text-xs font-black text-[#2B5AED]">
                {loading ? '' : `${data.kpis.accommodationsBookedPct}%`}
              </span>
            </div>
          </div>
        </article>
      </section>

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <article
          ref={reservationsPanelRef}
          className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-[0_1px_0_rgba(15,63,115,0.06)]"
        >
          <div className="border-b-4 border-[#2B5AED] px-4 pt-3">
            <div className="flex flex-wrap gap-1 border-b border-slate-100">
              {RES_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (resTab === 'newToday' && t.id !== 'newToday') {
                      setResDay('today')
                    }
                    setResTab(t.id)
                  }}
                  className={`border-b-2 px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                    resTab === t.id
                      ? 'border-[#2B5AED] text-[#2B5AED]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {resTab !== 'newToday' ? (
              <div className="flex gap-2 py-2">
                {['today', 'tomorrow'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setResDay(d)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize ${
                      resDay === d ? 'bg-[#2B5AED] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-2 text-xs font-semibold text-slate-500">
                Reservations created today with status pending, accepted, or assigned (any check-in date).
              </p>
            )}
            <label className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-[#f8fafc] px-3 py-2">
              <span className="text-slate-400">⌕</span>
              <input
                type="search"
                placeholder="Guest name"
                value={resSearch}
                onChange={(e) => setResSearch(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
          <div className="max-h-[420px] overflow-auto px-2 pb-3">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pl-2 pr-2">Guest</th>
                  <th className="py-2 pr-2">Conf #</th>
                  <th className="py-2 pr-2">Room</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : reservationRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      {resTab === 'newToday'
                        ? 'No reservations created today with pending, accepted, or assigned status.'
                        : 'No reservations for this view.'}
                    </td>
                  </tr>
                ) : (
                  reservationRows.map((row) => (
                    <tr key={`${row.confirmation}-${row.bookingId}`} className="border-b border-slate-100">
                      <td className="py-3 pl-2 pr-2 font-semibold text-[#0f3f73]">{row.guestName}</td>
                      <td className="py-3 pr-2 font-mono text-xs text-slate-600">{row.confirmation}</td>
                      <td className="py-3 pr-2 text-slate-600">{row.room}</td>
                      <td className="py-3 pr-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${newBookingsStatusPillClass(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/bookings/${row.bookingId}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            title="Open booking"
                          >
                            <IconChevron dir="right" className="h-4 w-4" />
                          </Link>
                          {(() => {
                            const tel = telHref(row.guestPhone)
                            if (tel) {
                              return (
                                <a
                                  href={tel}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  title="Call guest"
                                >
                                  <IconPhone className="h-4 w-4" />
                                </a>
                              )
                            }
                            return (
                              <span
                                className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-300"
                                title="No phone on file"
                              >
                                <IconPhone className="h-4 w-4" />
                              </span>
                            )
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-[0_1px_0_rgba(15,63,115,0.06)]">
          <div className="border-b-4 border-[#2B5AED] px-4 pt-3">
            <div className="flex flex-wrap gap-1 border-b border-slate-100">
              {ACTIVITY_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActivityTab(t.id)}
                  className={`border-b-2 px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                    activityTab === t.id
                      ? 'border-[#2B5AED] text-[#2B5AED]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {activityTab === 'sales' ? (
              <div className="grid grid-cols-3 gap-2 py-4 text-center sm:text-left">
                <div>
                  <p className="text-2xl font-black text-[#2B5AED]">{loading ? '—' : sales.bookedTodayCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Booked today</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#2B5AED]">{loading ? '—' : sales.roomNights}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Room nights</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#2B5AED]">
                    {loading ? '—' : formatMoney(sales.revenue, currency)}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Revenue</p>
                </div>
              </div>
            ) : (
              <div className="py-3 text-sm text-slate-500">
                {activityTab === 'cancellations'
                  ? 'Cancellations recorded today.'
                  : 'Overlapping assigned bookings on the same unit.'}
              </div>
            )}
          </div>
          <div className="max-h-[360px] overflow-auto px-2 pb-3">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pl-2 pr-2">Guest</th>
                  <th className="py-2 pr-2">Revenue</th>
                  <th className="py-2 pr-2">Check-in</th>
                  <th className="py-2 pr-2">Nights</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : activityRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No rows for this tab.
                    </td>
                  </tr>
                ) : (
                  activityRows.map((row) => (
                    <tr key={row.key} className="border-b border-slate-100">
                      <td className="py-2.5 pl-2 pr-2">
                        {row.bookingId ? (
                          <Link to={`/bookings/${row.bookingId}`} className="font-semibold text-[#0f3f73] hover:underline">
                            {row.guest}
                          </Link>
                        ) : (
                          row.guest
                        )}
                      </td>
                      <td className="py-2.5 pr-2 font-semibold text-[#0f3f73]">{row.revenue}</td>
                      <td className="py-2.5 pr-2 text-slate-600">{row.checkIn}</td>
                      <td className="py-2.5 pr-2 text-slate-600">{row.nights}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-blue-100 bg-white shadow-[0_1px_0_rgba(15,63,115,0.06)]">
        <div className="border-t-4 border-[#2B5AED] px-4 pb-4 pt-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0f3f73]">14 Day Outlook</h2>
              <div className="mt-3 flex flex-wrap gap-8">
                <div>
                  <p className="text-2xl font-black text-[#2B5AED]">
                    {loading ? '—' : `${data.outlook.occupancyPct14d.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-slate-800">14-day occupancy</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#2B5AED]">
                    {loading ? '—' : formatMoney(data.outlook.revenue14d, currency)}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-slate-800">14-day revenue</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setOutlookStart((s) => addDaysYmd(s, -1))}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                aria-label="Previous day"
              >
                <IconChevron dir="left" className="h-4 w-4" />
              </button>
              <div className="flex min-w-[200px] items-center justify-center gap-2 px-2 text-xs font-black uppercase text-slate-700">
                <IconCalendar className="h-4 w-4 text-[#2B5AED]" />
                {formatOutlookCenter(outlookStart)}
              </div>
              <button
                type="button"
                onClick={() => setOutlookStart((s) => addDaysYmd(s, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                aria-label="Next day"
              >
                <IconChevron dir="right" className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-6 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setOutlookMode('bookedBlocked')}
              className={`border-b-2 pb-2 text-sm font-bold ${
                outlookMode === 'bookedBlocked' ? 'border-[#2B5AED] text-[#2B5AED]' : 'border-transparent text-slate-600'
              }`}
            >
              Accommodations booked + blocked
            </button>
            <button
              type="button"
              onClick={() => setOutlookMode('availability')}
              className={`border-b-2 pb-2 text-sm font-bold ${
                outlookMode === 'availability' ? 'border-[#2B5AED] text-[#2B5AED]' : 'border-transparent text-slate-600'
              }`}
            >
              Availability
            </button>
          </div>

          <div className="mt-4 h-72 w-full">
            {chartPoints.length === 0 && !loading ? (
              <p className="py-16 text-center text-sm text-slate-500">No outlook data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    width={36}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, outlookMode === 'bookedBlocked' ? 'Occupied' : 'Available']}
                    labelFormatter={(l) => l}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="chartValue"
                    stroke="#93C5FD"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#60A5FA', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
            High occupancy (80%+ on chart axis)
          </div>
        </div>
      </article>
    </div>
  )
}
