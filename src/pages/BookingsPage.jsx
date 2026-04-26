import { useCallback, useEffect, useMemo, useState } from 'react'

const BOOKINGS_PER_PAGE = 15
const SEARCH_DEBOUNCE_MS = 350
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { apiFetch } from '../utils/api'
import {
  STATUS_OPTIONS,
  formatMoney,
  formatYmdToDisplay,
  sourceLabel,
  statusBadgeClass,
  statusLabel,
} from './bookingsCommon'

/** List row: multi-unit portal batches show room names only after the host marks the group assigned. */
function bookingsListUnitLabel(row) {
  const multiBatch =
    row?.portalBatchId && Array.isArray(row.batchBookings) && row.batchBookings.length > 1
  if (multiBatch) {
    if (row.status !== 'assigned') return 'N/A'
    if (Array.isArray(row.batchUnitNames) && row.batchUnitNames.length > 0) {
      const names = row.batchUnitNames
        .map((n) => (typeof n === 'string' ? n.trim() : String(n ?? '').trim()))
        .filter(Boolean)
      if (names.length) return names.join(' · ')
    }
    const fromLines = row.batchBookings
      .map((line) => (typeof line?.unitName === 'string' ? line.unitName.trim() : ''))
      .filter(Boolean)
    if (fromLines.length) return fromLines.join(' · ')
    return '—'
  }
  if (Array.isArray(row?.batchUnitNames) && row.batchUnitNames.length > 0) {
    const names = row.batchUnitNames
      .map((n) => (typeof n === 'string' ? n.trim() : String(n ?? '').trim()))
      .filter(Boolean)
    if (names.length) return names.join(' · ')
  }
  if (row?.status === 'pending' || row?.status === 'cancelled') return 'N/A'
  return row?.unitName ?? '—'
}

function bookingsListPriceAmount(row) {
  if (row?.portalBatchId && row.batchTotalPrice != null && Number.isFinite(Number(row.batchTotalPrice))) {
    return Number(row.batchTotalPrice)
  }
  return row?.totalPrice
}

function HouseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 10.5 12 4l9 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1h4v-7h5v7h4a1 1 0 0 0 1-1V9.5" strokeLinejoin="round" />
    </svg>
  )
}

function BookingModal({ open, title, units, saving, error, onClose, onSave }) {
  const empty = useMemo(
    () => ({
      unitId: units[0]?.id ?? '',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      checkIn: '',
      checkOut: '',
      adults: 2,
      children: 0,
      source: 'manual',
      status: 'pending',
      notes: '',
      totalPrice: '',
    }),
    [units],
  )

  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (!open) {
      return
    }
    setForm(empty)
  }, [open, empty])

  if (!open) {
    return null
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      unitId: Number(form.unitId),
      guestName: form.guestName.trim(),
      guestEmail: form.guestEmail.trim(),
      guestPhone: form.guestPhone.trim(),
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adults: Number(form.adults),
      children: Number(form.children),
      source: form.source,
      status: form.status,
      notes: form.notes.trim() || null,
    }
    const tp = form.totalPrice.trim()
    if (tp !== '') {
      payload.totalPrice = Number(tp)
    }
    onSave(payload)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="max-h-[min(92vh,760px)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-black text-[#0f3f73]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg font-bold text-slate-500 hover:bg-slate-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">{error}</div>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Unit</span>
            <select
              required
              value={String(form.unitId)}
              onChange={(e) => setField('unitId', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Guest name</span>
            <input
              required
              value={form.guestName}
              onChange={(e) => setField('guestName', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Email</span>
              <input
                required
                type="email"
                value={form.guestEmail}
                onChange={(e) => setField('guestEmail', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Phone</span>
              <input
                required
                value={form.guestPhone}
                onChange={(e) => setField('guestPhone', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Check-in</span>
              <input
                required
                type="date"
                value={form.checkIn}
                onChange={(e) => setField('checkIn', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Check-out</span>
              <input
                required
                type="date"
                value={form.checkOut}
                min={form.checkIn || undefined}
                onChange={(e) => setField('checkOut', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Adults</span>
              <input
                required
                type="number"
                min={1}
                value={form.adults}
                onChange={(e) => setField('adults', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Children</span>
              <input
                required
                type="number"
                min={0}
                value={form.children}
                onChange={(e) => setField('children', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Source</span>
              <select
                value={form.source}
                onChange={(e) => setField('source', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="manual">Manual</option>
                <option value="airbnb">Airbnb</option>
                <option value="booking_com">Booking.com</option>
                <option value="expedia">Expedia</option>
                <option value="vrbo">VRBO</option>
                <option value="direct_portal">Direct portal</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Status</span>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="assigned">Assigned</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Total price (optional)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.totalPrice}
              onChange={(e) => setField('totalPrice', e.target.value)}
              placeholder="Leave blank to use unit nightly rate × nights"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#1B4F8A] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BookingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') ?? '')

  const [bookings, setBookings] = useState([])
  const [listMeta, setListMeta] = useState(null)
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(null)

  const [statusFilter, setStatusFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSearchInput(searchParams.get('q') ?? '')
    // Only when navigation changes (back/forward, sidebar); not when `q` updates from our debounced URL sync.
  }, [location.key])

  useEffect(() => {
    if (searchParams.get('new') !== '1') {
      return
    }
    setModalOpen(true)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('new')
        return next
      },
      { replace: true },
    )
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const prevQ = (prev.get('q') ?? '').trim()
          const q = searchInput.trim()
          if (q !== prevQ) {
            next.set('page', '1')
          }
          if (q) {
            next.set('q', q)
          } else {
            next.delete('q')
          }
          return next
        },
        { replace: true },
      )
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [searchInput, setSearchParams])

  const loadBookings = useCallback(async () => {
    setListError(null)
    const qApi = (searchParams.get('q') ?? '').trim()
    const pageApi = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const params = new URLSearchParams()
    params.set('page', String(pageApi))
    params.set('perPage', String(BOOKINGS_PER_PAGE))
    if (qApi) {
      params.set('q', qApi)
    }
    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter)
    }
    const data = await apiFetch(`/v1/bookings?${params.toString()}`)
    setBookings(Array.isArray(data?.bookings) ? data.bookings : [])
    if (data?.meta && typeof data.meta === 'object') {
      setListMeta({
        currentPage: Number(data.meta.currentPage) || 1,
        lastPage: Number(data.meta.lastPage) || 1,
        perPage: Number(data.meta.perPage) || BOOKINGS_PER_PAGE,
        total: Number(data.meta.total) || 0,
        from: data.meta.from ?? null,
        to: data.meta.to ?? null,
      })
    } else {
      setListMeta(null)
    }
  }, [searchParams, statusFilter])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const uRes = await apiFetch('/v1/configuration/units')
        if (!cancelled && uRes?.units) {
          setUnits(uRes.units)
        }
      } catch {
        // Units are optional for list display; modal may stay empty.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setListError(null)
      try {
        await loadBookings()
      } catch (e) {
        if (!cancelled) {
          setListError(e instanceof Error ? e.message : 'Could not load bookings.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [loadBookings])

  async function refresh() {
    try {
      await loadBookings()
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Could not load bookings.')
    }
  }

  function openCreate() {
    setModalError(null)
    setModalOpen(true)
  }

  async function handleSave(payload) {
    setSaving(true)
    setModalError(null)
    try {
      await apiFetch('/v1/bookings', { method: 'POST', body: JSON.stringify(payload) })
      setModalOpen(false)
      await refresh()
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const unitOptions = useMemo(() => {
    return units.map((u) => ({ id: u.id, name: u.name }))
  }, [units])

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0f3f73]">Bookings</h1>
            <p className="mt-1 text-sm text-slate-500">Manage reservations, including requests from your direct portal.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            disabled={!unitOptions.length}
            title={!unitOptions.length ? 'Add a unit under Configuration first' : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B4F8A] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg leading-none">+</span>
            New booking
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-[#fbfdff] px-3 py-2">
            <span className="text-slate-400">⌕</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by guest, email, phone, reference, or unit…"
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              aria-label="Search bookings"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              const v = e.target.value
              setStatusFilter(v)
              setSearchParams(
                (prev) => {
                  const next = new URLSearchParams(prev)
                  next.set('page', '1')
                  return next
                },
                { replace: true },
              )
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 sm:w-48"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {listError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{listError}</div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Check-in</th>
                  <th className="px-4 py-3">Check-out</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                      No bookings match your filters.
                    </td>
                  </tr>
                ) : (
                  bookings.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-4 align-top">
                        <p className="font-bold text-slate-900">{row.guestName}</p>
                        {row.portalBatchId && Array.isArray(row.batchBookings) && row.batchBookings.length > 1 ? (
                          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {row.batchBookings.length} units
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-start gap-2">
                          <HouseIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span className="font-semibold text-slate-800">{bookingsListUnitLabel(row)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top tabular-nums text-slate-700">{formatYmdToDisplay(row.checkIn)}</td>
                      <td className="px-4 py-4 align-top tabular-nums text-slate-700">{formatYmdToDisplay(row.checkOut)}</td>
                      <td className="px-4 py-4 align-top text-slate-700">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold">
                          <span title="Adults">👤{row.adults}</span>
                          <span title="Children">👶{row.children}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top font-semibold tabular-nums text-slate-900">
                        {formatMoney(bookingsListPriceAmount(row), row.currency)}
                      </td>
                      <td className="px-4 py-4 align-top text-slate-600">{sourceLabel(row.source)}</td>
                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${statusBadgeClass(row.status)}`}
                        >
                          {statusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/bookings/${row.id}`)}
                          className="inline-flex min-h-9 min-w-[4.5rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#0f3f73] shadow-sm hover:bg-slate-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {listMeta && listMeta.total > 0 ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                {listMeta.from != null && listMeta.to != null ? (
                  <>
                    Showing <span className="font-semibold text-slate-800">{listMeta.from}</span>–
                    <span className="font-semibold text-slate-800">{listMeta.to}</span> of{' '}
                    <span className="font-semibold text-slate-800">{listMeta.total}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-800">{listMeta.total}</span> result
                    {listMeta.total === 1 ? '' : 's'}
                  </>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={loading || listMeta.currentPage <= 1}
                  onClick={() => {
                    setSearchParams(
                      (prev) => {
                        const next = new URLSearchParams(prev)
                        next.set('page', String(Math.max(1, listMeta.currentPage - 1)))
                        return next
                      },
                      { replace: true },
                    )
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 text-sm font-semibold tabular-nums text-slate-600">
                  Page {listMeta.currentPage} of {listMeta.lastPage}
                </span>
                <button
                  type="button"
                  disabled={loading || listMeta.currentPage >= listMeta.lastPage}
                  onClick={() => {
                    setSearchParams(
                      (prev) => {
                        const next = new URLSearchParams(prev)
                        next.set('page', String(Math.min(listMeta.lastPage, listMeta.currentPage + 1)))
                        return next
                      },
                      { replace: true },
                    )
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <BookingModal
        open={modalOpen}
        title="New booking"
        units={unitOptions.length ? unitOptions : [{ id: '', name: 'Add a unit in Configuration first' }]}
        saving={saving}
        error={modalError}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

    </div>
  )
}

export default BookingsPage
