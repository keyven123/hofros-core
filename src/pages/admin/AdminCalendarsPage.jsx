import { useEffect, useMemo, useState } from 'react'
import { AdminHeading, AdminSearch, matchesQuery } from '../../components/admin/adminUi'
import { adminFetch } from '../../utils/adminApi'

const VISIBLE_DAYS = 21
const OCCUPYING = new Set(['accepted', 'assigned', 'checked_in', 'checked_out'])

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toYmd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function parseYmd(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(ymd, days) {
  const date = parseYmd(ymd)
  if (!date) return ymd
  date.setDate(date.getDate() + days)
  return toYmd(date)
}

function eachDay(from, toExclusive) {
  const start = parseYmd(from)
  const end = parseYmd(toExclusive)
  if (!start || !end || end <= start) return []
  const days = []
  const cursor = new Date(start)
  while (cursor < end) {
    days.push(toYmd(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

function barColor(status) {
  if (status === 'checked_out') return 'bg-slate-500 text-white'
  if (status === 'checked_in') return 'bg-violet-600 text-white'
  if (status === 'assigned') return 'bg-sky-600 text-white'
  return 'bg-amber-500 text-white'
}

function roomSubtitle(room) {
  const parts = []
  if (room.type) parts.push(room.type)
  if (room.bedrooms) parts.push(`${room.bedrooms} bedroom${room.bedrooms === 1 ? '' : 's'}`)
  if (room.beds) parts.push(`${room.beds} bed${room.beds === 1 ? '' : 's'}`)
  if (room.maxGuests) parts.push(`Max ${room.maxGuests} guest${room.maxGuests === 1 ? '' : 's'}`)
  if (room.status && room.status !== 'active') parts.push(room.status)
  return parts.join(' · ') || 'Room'
}

function AdminCalendarsPage() {
  const [anchor, setAnchor] = useState(() => toYmd(new Date()))
  const [merchants, setMerchants] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const from = anchor
  const to = addDays(anchor, VISIBLE_DAYS)
  const days = useMemo(() => eachDay(from, to), [from, to])
  const today = toYmd(new Date())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    adminFetch(`/v1/admin/calendars?from=${from}&to=${to}`)
      .then((data) => {
        if (!cancelled) setMerchants(data.merchants ?? [])
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load the calendar.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [from, to])

  const visible = useMemo(
    () =>
      merchants
        .map((merchant) => ({
          ...merchant,
          rooms: (merchant.rooms ?? []).filter((room) => matchesQuery(query, [room.name, merchant.name, room.type, room.status])),
        }))
        .filter((merchant) => merchant.rooms.length > 0),
    [merchants, query],
  )
  const roomCount = merchants.reduce((sum, merchant) => sum + (merchant.rooms?.length || 0), 0)

  function barStyle(startYmd, endYmd) {
    const startIndex = days.findIndex((day) => day >= startYmd)
    const endIndex = days.findIndex((day) => day >= endYmd)
    const start = startIndex === -1 ? 0 : startIndex + (startYmd >= from ? 0.15 : 0)
    const end = endIndex === -1 ? days.length : endIndex
    const span = Math.max(0.35, end - start)
    return {
      left: `calc(100% * ${start} / ${days.length})`,
      width: `calc(100% * ${span} / ${days.length})`,
    }
  }

  return (
    <div className="flex min-h-0 flex-col">
      <AdminHeading
        kicker="Reservations"
        title="Calendars"
        description="The same room calendar merchants use, for every room that has been created. This board is view only."
      >
        <AdminSearch value={query} onChange={setQuery} placeholder="Search rooms or merchants" />
      </AdminHeading>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setAnchor((current) => addDays(current, -7))} className="h-10 rounded-full border border-[#e8e4dc] bg-white px-4 text-sm font-semibold text-slate-600">
          Previous
        </button>
        <button type="button" onClick={() => setAnchor(toYmd(new Date()))} className="h-10 rounded-full border border-[#e8e4dc] bg-white px-4 text-sm font-semibold text-[#0b1020]">
          Today
        </button>
        <button type="button" onClick={() => setAnchor((current) => addDays(current, 7))} className="h-10 rounded-full border border-[#e8e4dc] bg-white px-4 text-sm font-semibold text-slate-600">
          Next
        </button>
        <span className="text-sm font-semibold text-slate-600">
          {from} – {addDays(to, -1)}
        </span>
        <span className="rounded-full bg-[#0b1020] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e8c872]">
          View only · {loading ? '…' : roomCount} rooms
        </span>
      </div>

      {error ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}
      {selected ? (
        <p className="mb-4 rounded-2xl border border-[#e8e4dc] bg-white px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-[#0b1020]">{selected.guest || selected.label}</span>
          {' · '}
          {selected.merchant} · {selected.room} · {selected.start} – {selected.end}
          {selected.status ? ` · ${selected.status.replace(/_/g, ' ')}` : ''}
        </p>
      ) : null}

      <div className="min-h-[520px] overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="max-h-[70vh] overflow-auto">
          <div className="sticky top-0 z-20 flex min-w-[980px] border-b border-slate-200 bg-[#f8fafc]">
            <div className="sticky left-0 z-30 w-[240px] shrink-0 border-r border-slate-200 bg-[#f8fafc] px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
              Rooms
            </div>
            <div className="min-w-0 flex-1">
              <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
                {days.map((day) => {
                  const date = parseYmd(day)
                  return (
                    <div key={day} className={`border-r border-slate-200 px-0.5 py-2 text-center last:border-r-0 ${day === today ? 'bg-[#f8f1de]' : ''}`}>
                      <div className="truncate text-[9px] font-bold uppercase text-slate-400">
                        {date?.toLocaleDateString(undefined, { month: 'short' })}
                      </div>
                      <div className="truncate text-[10px] font-black tabular-nums text-slate-700">
                        {date?.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {loading ? <p className="px-4 py-10 text-sm text-slate-500">Loading rooms…</p> : null}
          {!loading && visible.length === 0 ? <p className="px-4 py-10 text-sm text-slate-500">No created rooms match this view.</p> : null}

          {visible.map((merchant) => (
            <div key={merchant.id} className="min-w-[980px]">
              <div className="sticky left-0 border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
                {merchant.name}
                <span className="ml-2 font-semibold normal-case tracking-normal text-slate-400">{merchant.rooms.length} rooms</span>
              </div>
              {merchant.rooms.map((room) => (
                <div key={room.id} className="flex border-b border-slate-100">
                  <div className="sticky left-0 z-10 w-[240px] shrink-0 border-r border-slate-200 bg-white px-3 py-2">
                    <p className="text-sm font-bold text-slate-900">{room.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500">{roomSubtitle(room)}</p>
                  </div>
                  <div className="relative min-h-[46px] min-w-0 flex-1 bg-white">
                    <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
                      {days.map((day) => (
                        <div key={day} className={`border-r border-slate-50 last:border-r-0 ${day === today ? 'bg-[#f8f1de]/70' : ''}`} />
                      ))}
                    </div>
                    {(room.bookings || []).filter((stay) => OCCUPYING.has(stay.status) && overlaps(from, to, stay.checkIn, stay.checkOut)).map((stay) => (
                      <button
                        key={stay.id}
                        type="button"
                        title={`${stay.guest} · ${stay.checkIn} – ${stay.checkOut}`}
                        onClick={() => setSelected({ guest: stay.guest, merchant: merchant.name, room: room.name, start: stay.checkIn, end: stay.checkOut, status: stay.status })}
                        className={`absolute top-[10px] z-[2] flex h-[26px] items-center overflow-hidden px-2 text-left text-[11px] font-semibold ${barColor(stay.status)}`}
                        style={barStyle(stay.checkIn, stay.checkOut)}
                      >
                        <span className="truncate">{stay.guest}</span>
                      </button>
                    ))}
                    {(room.blocks || []).filter((block) => overlaps(from, to, block.startDate, block.endDate)).map((block) => (
                      <button
                        key={block.id}
                        type="button"
                        title={block.label || 'Blocked'}
                        onClick={() => setSelected({ label: block.label || 'Blocked', merchant: merchant.name, room: room.name, start: block.startDate, end: block.endDate })}
                        className="absolute top-[10px] z-[3] flex h-[26px] items-center overflow-hidden bg-rose-700 px-2 text-left text-[11px] font-semibold text-white"
                        style={barStyle(block.startDate, block.endDate)}
                      >
                        <span className="truncate">{block.label || 'Blocked'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 rounded-2xl border border-[#e8e4dc] bg-white px-4 py-3 text-xs text-slate-600">
        <Legend swatch="bg-amber-500" label="Accepted" />
        <Legend swatch="bg-sky-600" label="Assigned" />
        <Legend swatch="bg-violet-600" label="Checked in" />
        <Legend swatch="bg-slate-500" label="Checked out" />
        <Legend swatch="bg-rose-700" label="Blocked dates" />
      </div>
    </div>
  )
}

function Legend({ swatch, label }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold">
      <span className={`h-3 w-3 rounded-sm ${swatch}`} />
      {label}
    </span>
  )
}

export default AdminCalendarsPage
