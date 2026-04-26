import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'
import { stayRangesOverlap } from '../utils/stayRange'
import { formatMoney, sourceLabel, statusLabel } from './bookingsCommon'

const VISIBLE_DAYS = 21

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toYmd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function parseYmd(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDaysYmd(ymd, days) {
  const dt = parseYmd(ymd)
  if (!dt) return ymd
  dt.setDate(dt.getDate() + days)
  return toYmd(dt)
}

function ymdLabel(ymd) {
  const dt = parseYmd(ymd)
  if (!dt) return ymd
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** DD/MM/YYYY for reservation popover (matches common property UI). */
function formatYmdSlash(ymd) {
  const dt = parseYmd(ymd)
  if (!dt) return ymd
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function normalizeSpecType(v) {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

function normalizeSpecCount(v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function unitSpecMatches(unit, pending) {
  const sameAccommodation = String(unit?.propertyId ?? '') === String(pending?.propertyId ?? '')
  return (
    sameAccommodation &&
    normalizeSpecType(unit?.type) === normalizeSpecType(pending?.type) &&
    normalizeSpecCount(unit?.bedrooms) === normalizeSpecCount(pending?.bedrooms) &&
    normalizeSpecCount(unit?.beds) === normalizeSpecCount(pending?.beds) &&
    normalizeSpecCount(unit?.maxGuests) === normalizeSpecCount(pending?.maxGuests)
  )
}

function bookingSpecLabel(row) {
  const parts = []
  if (row?.type && String(row.type).trim()) parts.push(String(row.type).trim())
  const bedrooms = normalizeSpecCount(row?.bedrooms)
  if (bedrooms > 0) parts.push(`${bedrooms} bedroom${bedrooms === 1 ? '' : 's'}`)
  const beds = normalizeSpecCount(row?.beds)
  if (beds > 0) parts.push(`${beds} bed${beds === 1 ? '' : 's'}`)
  const guests = normalizeSpecCount(row?.maxGuests)
  parts.push(`Max ${guests} guest${guests === 1 ? '' : 's'}`)
  return parts.join(' · ')
}

/** Calendar unit row: type, bedrooms, beds, max guests (omits empty parts). */
function unitSpecsSubtitle(unit) {
  const parts = []
  if (unit?.type && String(unit.type).trim()) parts.push(String(unit.type).trim())
  const bedrooms = normalizeSpecCount(unit?.bedrooms)
  if (bedrooms > 0) parts.push(`${bedrooms} bedroom${bedrooms === 1 ? '' : 's'}`)
  const beds = normalizeSpecCount(unit?.beds)
  if (beds > 0) parts.push(`${beds} bed${beds === 1 ? '' : 's'}`)
  const guests = normalizeSpecCount(unit?.maxGuests)
  if (guests > 0) parts.push(`Max ${guests} guest${guests === 1 ? '' : 's'}`)
  return parts.length > 0 ? parts.join(' · ') : '—'
}

function eachDayYmd(fromYmd, toYmdExclusive) {
  const a = parseYmd(fromYmd)
  const b = parseYmd(toYmdExclusive)
  if (!a || !b || b <= a) return []
  const out = []
  const cur = new Date(a)
  while (cur < b) {
    out.push(toYmd(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

function startOfWeekMonday(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = x.getDay()
  const delta = dow === 0 ? -6 : 1 - dow
  x.setDate(x.getDate() + delta)
  return x
}

function bookingBarColor(status) {
  if (status === 'checked_out') {
    return 'bg-slate-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
  }
  if (status === 'checked_in') {
    return 'bg-violet-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
  }
  if (status === 'assigned') {
    return 'bg-sky-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
  }
  return 'bg-amber-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
}

function isAcceptedStatus(status) {
  return status === 'accepted'
}

function isFirmBookedStatus(status) {
  return status === 'assigned' || status === 'checked_in' || status === 'checked_out'
}

/** Bookings that occupy the unit timeline (same semantics as guest portal firm holds). */
function isTimelineOccupyingBookingStatus(status) {
  return isFirmBookedStatus(status) || isAcceptedStatus(status)
}

/** True if a block [startYmd, endYmd) overlaps any accepted/assigned booking on the unit. */
function blockRangeOverlapsUnitTimelineBookings(unit, startYmd, endYmd) {
  if (!unit || !startYmd || !endYmd) return false
  for (const b of unit.bookings || []) {
    if (!isTimelineOccupyingBookingStatus(b?.status)) continue
    if (b.checkIn && b.checkOut && stayRangesOverlap(startYmd, endYmd, b.checkIn, b.checkOut)) {
      return true
    }
  }
  return false
}

/**
 * Fixed horizontal skew in px (not % of bar width) so every bar uses the same diagonal angle.
 * That way a long booking and a short booking still “mesh” at the seam like the reference UI.
 */
const TIMELINE_BAR_SKEW_PX = 8

function timelineBarClipPath({ leftDiag, rightDiag }) {
  const x = TIMELINE_BAR_SKEW_PX
  if (!leftDiag && !rightDiag) {
    return 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
  }
  if (!leftDiag && rightDiag) {
    return `polygon(0 0, 100% 0, calc(100% - ${x}px) 100%, 0 100%)`
  }
  if (leftDiag && !rightDiag) {
    return `polygon(${x}px 0, 100% 0, 100% 100%, 0 100%)`
  }
  return `polygon(${x}px 0, 100% 0, calc(100% - ${x}px) 100%, 0 100%)`
}

function bookingHasBalanceDue(booking) {
  const n = Number(booking?.balanceDue)
  return Number.isFinite(n) && n > 0.009
}

function accommodationKeyForUnit(u) {
  const propertyName = typeof u?.propertyName === 'string' ? u.propertyName.trim() : ''
  const fallback = 'Unassigned accommodation'
  return u?.propertyId != null ? `p:${u.propertyId}` : `n:${propertyName || fallback}`
}

function groupUnitsByAccommodation(units) {
  const map = new Map()
  for (const u of units) {
    const propertyName = typeof u?.propertyName === 'string' ? u.propertyName.trim() : ''
    const fallback = 'Unassigned accommodation'
    const key = accommodationKeyForUnit(u)
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: propertyName || fallback,
        rows: [],
      })
    }
    map.get(key).rows.push(u)
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
}

function BlockModal({
  open,
  mode,
  units,
  initial,
  saving,
  error,
  onClose,
  onSave,
  onDelete,
}) {
  const accommodationGroups = useMemo(() => groupUnitsByAccommodation(units), [units])
  const [accommodationKey, setAccommodationKey] = useState('')
  const [unitId, setUnitId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [label, setLabel] = useState('Blocked')
  const [notes, setNotes] = useState('')

  const unitsForAccommodation = useMemo(() => {
    if (!accommodationKey) return units
    return units.filter((u) => accommodationKeyForUnit(u) === accommodationKey)
  }, [units, accommodationKey])

  useEffect(() => {
    if (!open) {
      return
    }
    const uid = String(initial?.unitId ?? units[0]?.id ?? '')
    const row = units.find((u) => String(u.id) === uid) || units[0]
    setAccommodationKey(row ? accommodationKeyForUnit(row) : '')
    setUnitId(uid)
    setStartDate(initial?.startDate ?? '')
    setEndDate(initial?.endDate ?? '')
    setLabel(initial?.label ?? 'Blocked')
    setNotes(initial?.notes ?? '')
  }, [initial, units, open])

  useEffect(() => {
    if (!open || mode === 'edit') return
    if (unitsForAccommodation.length === 0) return
    const ok = unitsForAccommodation.some((u) => String(u.id) === String(unitId))
    if (!ok) {
      setUnitId(String(unitsForAccommodation[0].id))
    }
  }, [open, mode, unitsForAccommodation, unitId])

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      id: initial?.id,
      unitId: Number(unitId),
      startDate,
      endDate,
      label: label.trim() || 'Blocked',
      notes: notes.trim() || null,
    })
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'create' ? 'Block dates' : 'Edit blocked dates'}
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-black text-[#0f3f73]">{mode === 'create' ? 'Block dates' : 'Edit block'}</h2>
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
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Accommodation
            </span>
            <select
              value={accommodationKey}
              onChange={(e) => {
                setAccommodationKey(e.target.value)
                const next = units.filter((u) => accommodationKeyForUnit(u) === e.target.value)
                if (next[0]) setUnitId(String(next[0].id))
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
              required
              disabled={mode === 'edit'}
            >
              {accommodationGroups.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Unit</span>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
              required
              disabled={mode === 'edit'}
            >
              {unitsForAccommodation.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name}
                </option>
              ))}
            </select>
            {mode === 'edit' ? (
              <p className="mt-1 text-[11px] text-slate-500">
                Accommodation and unit cannot be changed. Delete and recreate if needed.
              </p>
            ) : null}
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Start (check-in)</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">End (check-out)</span>
              <input
                type="date"
                value={endDate}
                min={startDate ? addDaysYmd(startDate, 1) : undefined}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Uses the same rule as bookings: the last <span className="font-bold">occupied night</span> is the day before check-out (check-out morning is free).
          </p>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Label</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Maintenance, owner stay…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {mode === 'edit' && initial?.id ? (
              <button
                type="button"
                onClick={() => onDelete(initial.id)}
                disabled={saving}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
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
                className="rounded-xl bg-[#2B5AED] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : mode === 'create' ? 'Create block' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function popoverBalanceDue(detail, calendarSummary) {
  const fromDetail = Number(detail?.balanceDue)
  if (Number.isFinite(fromDetail)) return fromDetail
  const fromCal = Number(calendarSummary?.balanceDue)
  return Number.isFinite(fromCal) ? fromCal : 0
}

function calendarPopoverHeaderStatus(status) {
  if (status === 'checked_out') return 'Checked out'
  if (status === 'checked_in') return 'Checked in'
  if (status === 'assigned') return 'Confirmed'
  return statusLabel(status)
}

function notesStringToList(value) {
  if (typeof value !== 'string') return []
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function notesListToString(items) {
  return (Array.isArray(items) ? items : [])
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean)
    .join('\n')
}

function CalendarBookingDetailPopover({
  open,
  anchorRect,
  unitName,
  moveUnits,
  calendarSummary,
  detail,
  loading,
  fetchError,
  onClose,
  onNavigateDetails,
  onUnassign,
  onCheckIn,
  onCheckOut,
  onSaveNotes,
  notesSaving,
  onMoveBooking,
  movingBooking,
  checkingIn,
  checkingOut,
  unassigning,
}) {
  const [tab, setTab] = useState('reservation')
  const [notesDraft, setNotesDraft] = useState('')
  const [notesItems, setNotesItems] = useState([])
  const [noteInput, setNoteInput] = useState('')
  const [notesDirty, setNotesDirty] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [moveUnitId, setMoveUnitId] = useState('')
  const [moveCheckIn, setMoveCheckIn] = useState('')
  const [moveCheckOut, setMoveCheckOut] = useState('')
  const [moveError, setMoveError] = useState(null)
  const [confirmMoveOpen, setConfirmMoveOpen] = useState(false)

  useEffect(() => {
    if (open) setTab('reservation')
  }, [open, detail?.id])

  useEffect(() => {
    const current = typeof detail?.notes === 'string' ? detail.notes : ''
    setNotesDraft(current)
    setNotesItems(notesStringToList(current))
    setNoteInput('')
    setNotesDirty(false)
  }, [detail?.id, detail?.notes, open])

  useEffect(() => {
    if (!open) {
      setMoveOpen(false)
      setConfirmMoveOpen(false)
      setMoveError(null)
      return
    }
    const nextUnitId = String(detail?.unitId ?? calendarSummary?.unitId ?? '')
    const nextCheckIn = detail?.checkIn ?? calendarSummary?.checkIn ?? ''
    const nextCheckOut = detail?.checkOut ?? calendarSummary?.checkOut ?? ''
    setMoveUnitId(nextUnitId)
    setMoveCheckIn(nextCheckIn)
    setMoveCheckOut(nextCheckOut)
  }, [open, detail?.id, detail?.unitId, detail?.checkIn, detail?.checkOut, calendarSummary?.unitId, calendarSummary?.checkIn, calendarSummary?.checkOut])

  const layout = useMemo(() => {
    if (!open || !anchorRect || typeof window === 'undefined') return null
    const margin = 12
    const w = Math.min(620, window.innerWidth - margin * 2)
    const barLeft = anchorRect.left
    const anchorCx = barLeft + anchorRect.width / 2
    let left = anchorCx - w / 2
    left = Math.max(margin, Math.min(left, window.innerWidth - w - margin))
    const estimatedH = 340
    const gap = 10
    let top = anchorRect.top - estimatedH - gap
    let placement = 'top'
    if (top < margin) {
      placement = 'bottom'
      top = anchorRect.bottom + gap
      if (top + estimatedH > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - estimatedH - margin)
      }
    }
    return { top, left, width: w, placement, anchorCx }
  }, [open, anchorRect])

  const popoverRef = useRef(null)
  const [popoverBox, setPopoverBox] = useState(null)

  useLayoutEffect(() => {
    if (!open || !layout) {
      setPopoverBox(null)
      return
    }
    const el = popoverRef.current
    if (!el) return
    function measure() {
      const node = popoverRef.current
      if (!node) return
      setPopoverBox(node.getBoundingClientRect())
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, layout, loading, tab, fetchError, detail?.id])

  if (!open || !layout) return null

  const guestName = detail?.guestName ?? calendarSummary?.guestName ?? 'Guest'
  const status = detail?.status ?? calendarSummary?.status
  const reference = detail?.reference ?? calendarSummary?.reference
  const source = detail?.source ?? calendarSummary?.source
  const checkIn = detail?.checkIn ?? calendarSummary?.checkIn
  const checkOut = detail?.checkOut ?? calendarSummary?.checkOut
  const adults = detail?.adults ?? 0
  const children = detail?.children ?? 0
  const guestTotal =
    detail != null ? (Number(adults) || 0) + (Number(children) || 0) : null
  const totalPrice = detail?.totalPrice ?? calendarSummary?.totalPrice
  const currency = detail?.currency ?? calendarSummary?.currency
  const balanceDue = popoverBalanceDue(detail, calendarSummary)
  const notesCount = notesItems.length
  const moneyReady = totalPrice != null && currency != null
  const moveSpecTemplate = {
    propertyId: detail?.propertyId ?? calendarSummary?.propertyId ?? null,
    type: detail?.unitType ?? detail?.type ?? calendarSummary?.unitType ?? calendarSummary?.type,
    bedrooms: detail?.bedrooms ?? calendarSummary?.bedrooms ?? 0,
    beds: detail?.beds ?? calendarSummary?.beds ?? 0,
    maxGuests: detail?.maxGuests ?? calendarSummary?.maxGuests ?? 0,
  }
  const compatibleMoveUnits = (moveUnits || []).filter((u) => unitSpecMatches(u, moveSpecTemplate))
  const moveUnitsResolved = compatibleMoveUnits.length > 0 ? compatibleMoveUnits : moveUnits || []
  const selectedMoveUnit = moveUnitsResolved.find((u) => String(u.id) === String(moveUnitId))

  const linkRowClass =
    'flex w-full items-start gap-1.5 px-0.5 py-1.5 text-left text-[13px] font-semibold text-[#2b7cee] underline decoration-[#2b7cee]/35 underline-offset-2 transition hover:decoration-[#2b7cee]'

  function openMoveModal() {
    setMoveError(null)
    setMoveUnitId(String(detail?.unitId ?? calendarSummary?.unitId ?? ''))
    setMoveCheckIn(detail?.checkIn ?? calendarSummary?.checkIn ?? '')
    setMoveCheckOut(detail?.checkOut ?? calendarSummary?.checkOut ?? '')
    setMoveOpen(true)
  }

  async function handleSaveNotesClick() {
    if (!detail?.id) return
    try {
      const pending = noteInput.trim()
      const nextItems = pending ? [...notesItems, pending] : notesItems
      const value = notesListToString(nextItems)
      await onSaveNotes(value)
      setNotesItems(nextItems)
      setNoteInput('')
      setNotesDraft(value)
      setNotesDirty(false)
    } catch {
      // Parent already exposes API error in fetchError area.
    }
  }

  function handleAddNote() {
    const text = noteInput.trim()
    if (!text) return
    setNotesItems((prev) => [...prev, text])
    setNoteInput('')
    setNotesDirty(true)
  }

  function handleMoveContinue() {
    setMoveError(null)
    if (!moveUnitId) {
      setMoveError('Select a room / unit.')
      return
    }
    if (!moveCheckIn || !moveCheckOut || moveCheckOut <= moveCheckIn) {
      setMoveError('Check-out must be after check-in.')
      return
    }
    const currentUnitId = String(detail?.unitId ?? calendarSummary?.unitId ?? '')
    const currentCheckIn = detail?.checkIn ?? calendarSummary?.checkIn ?? ''
    const currentCheckOut = detail?.checkOut ?? calendarSummary?.checkOut ?? ''
    const changed =
      String(moveUnitId) !== String(currentUnitId) || moveCheckIn !== currentCheckIn || moveCheckOut !== currentCheckOut
    if (!changed) {
      setMoveError('No changes detected. Update date or room before moving.')
      return
    }
    setConfirmMoveOpen(true)
  }

  async function handleConfirmMove() {
    setMoveError(null)
    try {
      await onMoveBooking({
        unitId: Number(moveUnitId),
        checkIn: moveCheckIn,
        checkOut: moveCheckOut,
      })
      setConfirmMoveOpen(false)
      setMoveOpen(false)
      onClose()
    } catch (e) {
      setMoveError(e instanceof Error ? e.message : 'Could not move booking.')
      setConfirmMoveOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[130] cursor-default bg-slate-900/20"
        aria-label="Close booking details"
        onClick={onClose}
      />
      <div
        ref={popoverRef}
        className="fixed z-[131]"
        style={{ top: layout.top, left: layout.left, width: layout.width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cal-booking-popover-title"
      >
        <div className="relative w-full">
          <div className="w-full max-h-[min(92vh,calc(100vh-1.5rem))] overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200/95 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)]">
            <div className="relative bg-[#2b7cee] px-3 pb-3 pt-2.5 text-white">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg text-lg font-light leading-none text-white hover:bg-white/15"
                aria-label="Close"
              >
                ×
              </button>
              <p className="pr-9 text-[11px] font-normal leading-snug text-white/90 sm:text-[12px]">
                {reference ?? '—'} – {sourceLabel(source)}
              </p>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pr-9">
                <h2
                  id="cal-booking-popover-title"
                  className="min-w-0 max-w-full flex-1 break-words text-[14px] font-bold leading-tight tracking-tight"
                >
                  {guestName}
                  <span className="font-semibold text-white/95"> – {calendarPopoverHeaderStatus(status)}</span>
                </h2>
                <span className="max-w-full shrink-0 text-left text-[11px] font-bold leading-snug text-white sm:text-right sm:text-[12px]">
                  Grand total{' '}
                  <span className="text-white">
                    {moneyReady ? formatMoney(totalPrice, currency) : loading ? '…' : '—'}
                  </span>
                  {', '}
                  Balance{' '}
                  <span
                    className={
                      moneyReady && balanceDue > 0.009
                        ? 'text-red-300'
                        : moneyReady
                          ? 'text-emerald-200'
                          : 'text-white'
                    }
                  >
                    {moneyReady ? formatMoney(balanceDue, currency) : loading ? '…' : '—'}
                  </span>
                </span>
              </div>
            </div>

            <div>
              {fetchError ? (
                <div className="border-b border-slate-100 px-3 py-2 text-sm font-medium text-rose-700">{fetchError}</div>
              ) : null}
              <div className="grid grid-cols-1 gap-0 border-b border-slate-200 sm:grid-cols-[minmax(200px,1fr)_minmax(200px,1fr)]">
                <div className="border-slate-200 px-3 py-3 sm:border-r sm:border-slate-200">
                  {loading ? (
                    <p className="text-xs font-medium text-slate-500">Loading…</p>
                  ) : (
                    <dl className="space-y-1.5">
                      <div>
                        <dt className="text-xs font-bold text-slate-800">Check-in / out</dt>
                        <dd className="mt-px text-[13px] font-normal leading-snug text-slate-700">
                          {checkIn && checkOut
                            ? `${formatYmdSlash(checkIn)} - ${formatYmdSlash(checkOut)}`
                            : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-slate-800">Email</dt>
                        <dd className="mt-px break-all text-[13px] font-normal leading-snug text-slate-700">
                          {detail?.guestEmail ?? '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-slate-800">Phone</dt>
                        <dd className="mt-px text-[13px] font-normal leading-snug text-slate-700">
                          {detail?.guestPhone ?? '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-slate-800">Guests</dt>
                        <dd className="mt-px text-[13px] font-normal leading-snug text-slate-700">
                          {guestTotal != null && guestTotal > 0
                            ? `${guestTotal} (${Number(adults) || 0} adults, ${Number(children) || 0} children)`
                            : '—'}
                        </dd>
                      </div>
                      <div className="pt-1">
                        <button type="button" onClick={onNavigateDetails} className={linkRowClass}>
                          <span className="pt-0.5 font-bold text-[#2b7cee]" aria-hidden>
                            ›
                          </span>
                          Quick edit
                        </button>
                        <button type="button" onClick={openMoveModal} className={linkRowClass}>
                          <span className="pt-0.5 font-bold text-[#2b7cee]" aria-hidden>
                            ›
                          </span>
                          Move
                        </button>
                      </div>
                    </dl>
                  )}
                </div>

                <div className="flex flex-col bg-white">
                  <div className="flex border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTab('reservation')}
                      className={`flex-1 px-2 py-2 text-[11px] font-bold uppercase tracking-wide ${
                        tab === 'reservation'
                          ? 'border-b-[3px] border-[#2b7cee] text-[#2b7cee]'
                          : 'border-b-[3px] border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Reservation
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('notes')}
                      className={`flex-1 px-2 py-2 text-[11px] font-bold uppercase tracking-wide ${
                        tab === 'notes'
                          ? 'border-b-[3px] border-[#2b7cee] text-[#2b7cee]'
                          : 'border-b-[3px] border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Notes ({notesCount})
                    </button>
                  </div>
                  <div className="px-2.5 py-2">
                    {tab === 'reservation' ? (
                      <div className="flex flex-col gap-2">
                        <ul className="divide-y divide-slate-100">
                          <li>
                            <button type="button" onClick={onNavigateDetails} className={linkRowClass}>
                              <span className="pt-0.5 font-bold text-[#2b7cee]" aria-hidden>
                                ›
                              </span>
                              Reservation details
                            </button>
                          </li>
                          {status === 'assigned' ? (
                            <li>
                              <button
                                type="button"
                                disabled={unassigning}
                                onClick={onUnassign}
                                className={`${linkRowClass} disabled:opacity-50`}
                              >
                                <span className="pt-0.5 font-bold text-[#2b7cee]" aria-hidden>
                                  ›
                                </span>
                                {unassigning ? 'Updating…' : 'Un-assign room'}
                              </button>
                            </li>
                          ) : null}
                          {status === 'assigned' ? (
                            <li>
                              <button
                                type="button"
                                disabled={checkingIn}
                                onClick={onCheckIn}
                                className={`${linkRowClass} disabled:opacity-50`}
                              >
                                <span className="pt-0.5 font-bold text-[#2b7cee]" aria-hidden>
                                  ›
                                </span>
                                {checkingIn ? 'Updating…' : 'Check-in'}
                              </button>
                            </li>
                          ) : null}
                          {status === 'checked_in' ? (
                            <li>
                              <button
                                type="button"
                                disabled={checkingOut}
                                onClick={onCheckOut}
                                className={`${linkRowClass} disabled:opacity-50`}
                              >
                                <span className="pt-0.5 font-bold text-[#2b7cee]" aria-hidden>
                                  ›
                                </span>
                                {checkingOut ? 'Updating…' : 'Check-out'}
                              </button>
                            </li>
                          ) : null}
                        </ul>
                        <div className="rounded-md border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Unit</p>
                          {loading ? (
                            <p className="mt-1 text-xs text-slate-500">Loading…</p>
                          ) : (
                            <dl className="mt-1.5 space-y-1.5 text-[13px]">
                              {detail?.accommodationName ? (
                                <div>
                                  <dt className="text-xs font-bold text-slate-800">Accommodation</dt>
                                  <dd className="mt-px font-normal leading-snug text-slate-700">{detail.accommodationName}</dd>
                                </div>
                              ) : null}
                              <div>
                                <dt className="text-xs font-bold text-slate-800">Room / unit</dt>
                                <dd className="mt-px font-normal leading-snug text-slate-700">{detail?.unitName ?? unitName ?? '—'}</dd>
                              </div>
                            </dl>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 rounded-md border border-slate-100 bg-slate-50/50 p-2 text-[13px] text-slate-700">
                        <div className="max-h-[8.5rem] space-y-1.5 overflow-y-auto rounded-md border border-slate-200 bg-white px-2 py-2">
                          {notesItems.length === 0 ? (
                            <p className="text-[12px] text-slate-500">No notes yet.</p>
                          ) : (
                            notesItems.map((n, idx) => (
                              <div key={`note-${idx}`} className="flex items-start justify-between gap-2">
                                <p className="min-w-0 break-words text-[13px] leading-snug text-slate-700">
                                  {idx + 1}. {n}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNotesItems((prev) => prev.filter((_, i) => i !== idx))
                                    setNotesDirty(true)
                                  }}
                                  className="rounded px-1 py-0.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                                  aria-label="Remove note"
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddNote()
                              }
                            }}
                            placeholder="Add note item..."
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] text-slate-500">
                            Notes are visible in reservation details.
                          </p>
                          <button
                            type="button"
                            disabled={notesSaving}
                            onClick={handleSaveNotesClick}
                            className="rounded-md bg-[#2b7cee] px-2.5 py-1.5 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {notesSaving ? 'Saving…' : 'Save notes'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {moveOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-black text-slate-900">Move booking</h3>
              <button
                type="button"
                onClick={() => {
                  setMoveOpen(false)
                  setConfirmMoveOpen(false)
                  setMoveError(null)
                }}
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close move modal"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              {moveError ? <p className="rounded-md bg-rose-50 px-2 py-1.5 text-xs font-medium text-rose-700">{moveError}</p> : null}
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Room / unit</span>
                <select
                  value={moveUnitId}
                  onChange={(e) => setMoveUnitId(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-800"
                >
                  {moveUnitsResolved.map((u) => (
                    <option key={u.id} value={String(u.id)}>
                      {(u.propertyName ? `${u.propertyName} · ` : '') + u.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Check-in</span>
                  <input
                    type="date"
                    value={moveCheckIn}
                    onChange={(e) => setMoveCheckIn(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-800"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Check-out</span>
                  <input
                    type="date"
                    value={moveCheckOut}
                    onChange={(e) => setMoveCheckOut(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-800"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setMoveOpen(false)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={movingBooking}
                onClick={handleMoveContinue}
                className="rounded-md bg-[#2b7cee] px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmMoveOpen ? (
        <div className="fixed inset-0 z-[145] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
            <h4 className="text-sm font-black text-slate-900">Confirm move</h4>
            <p className="mt-1 text-xs text-slate-600">
              Move this booking to <span className="font-bold">{selectedMoveUnit?.name ?? 'selected unit'}</span> from{' '}
              <span className="font-semibold">{formatYmdSlash(moveCheckIn)}</span> to{' '}
              <span className="font-semibold">{formatYmdSlash(moveCheckOut)}</span>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={movingBooking}
                onClick={() => setConfirmMoveOpen(false)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={movingBooking}
                onClick={handleConfirmMove}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {movingBooking ? 'Moving…' : 'Confirm move'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {popoverBox && layout ? (
        layout.placement === 'top' ? (
          <div
            aria-hidden
            className="pointer-events-none fixed z-[132] h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[13px] border-x-transparent border-t-white drop-shadow-[0_2px_2px_rgba(15,23,42,0.07)]"
            style={{ left: layout.anchorCx, top: popoverBox.bottom }}
          />
        ) : (
          <div
            aria-hidden
            className="pointer-events-none fixed z-[132] h-0 w-0 -translate-x-1/2 -translate-y-full border-x-[12px] border-b-[13px] border-x-transparent border-b-white drop-shadow-[0_-1px_1px_rgba(15,23,42,0.06)]"
            style={{ left: layout.anchorCx, top: popoverBox.top }}
          />
        )
      ) : null}
    </>
  )
}

/** Merge booking API row with calendar units for assignment spec matching. */
function normalizeAssignmentBooking(raw, units) {
  const unit = units.find((u) => String(u.id) === String(raw?.unitId))
  return {
    ...raw,
    unitId: raw.unitId,
    propertyId: unit?.propertyId ?? raw.propertyId ?? null,
    propertyName: unit?.propertyName ?? raw.accommodationName ?? raw.propertyName ?? '',
    unitName: unit?.name ?? raw.unitName,
    type: unit?.type ?? raw.unitType ?? raw.type,
    bedrooms: unit?.bedrooms ?? raw.bedrooms,
    beds: unit?.beds ?? raw.beds,
    maxGuests: unit?.maxGuests ?? raw.maxGuests,
  }
}

function CalendarPage() {
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState(() => new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  /** Accepted bookings for Assignments (not limited to the calendar viewport). */
  const [acceptedQueueRaw, setAcceptedQueueRaw] = useState([])
  const [bookingDetailPopover, setBookingDetailPopover] = useState(null)
  const [bookingDetailPayload, setBookingDetailPayload] = useState(null)
  const [bookingDetailLoading, setBookingDetailLoading] = useState(false)
  const [bookingDetailError, setBookingDetailError] = useState(null)
  const [bookingUnassigning, setBookingUnassigning] = useState(false)
  const [bookingCheckingIn, setBookingCheckingIn] = useState(false)
  const [bookingCheckingOut, setBookingCheckingOut] = useState(false)
  const [bookingNotesSaving, setBookingNotesSaving] = useState(false)
  const [bookingMoving, setBookingMoving] = useState(false)

  const fromYmd = useMemo(() => toYmd(anchor), [anchor])
  const toYmdExclusive = useMemo(() => {
    const d = new Date(anchor)
    d.setDate(d.getDate() + VISIBLE_DAYS)
    return toYmd(d)
  }, [anchor])

  const dayHeaders = useMemo(() => eachDayYmd(fromYmd, toYmdExclusive), [fromYmd, toYmdExclusive])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const calUrl = `/v1/calendar?from=${encodeURIComponent(fromYmd)}&to=${encodeURIComponent(toYmdExclusive)}`
    const acceptedUrl = '/v1/bookings?status=accepted&expandBatch=1'
    const results = await Promise.allSettled([apiFetch(calUrl), apiFetch(acceptedUrl)])
    const cal = results[0]
    const acc = results[1]
    if (cal.status === 'fulfilled') {
      setData(cal.value)
      setError(null)
    } else {
      setData(null)
      setError(cal.reason instanceof Error ? cal.reason.message : 'Could not load calendar.')
    }
    if (acc.status === 'fulfilled' && Array.isArray(acc.value?.bookings)) {
      setAcceptedQueueRaw(acc.value.bookings)
    } else {
      setAcceptedQueueRaw([])
    }
    setLoading(false)
  }, [fromYmd, toYmdExclusive])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!bookingDetailPopover?.bookingId) {
      setBookingDetailPayload(null)
      setBookingDetailError(null)
      setBookingDetailLoading(false)
      return
    }
    let cancelled = false
    setBookingDetailLoading(true)
    setBookingDetailError(null)
    setBookingDetailPayload(null)
    void apiFetch(`/v1/bookings/${bookingDetailPopover.bookingId}`)
      .then((data) => {
        if (!cancelled) setBookingDetailPayload(data)
      })
      .catch((e) => {
        if (!cancelled) {
          setBookingDetailError(e instanceof Error ? e.message : 'Could not load booking.')
        }
      })
      .finally(() => {
        if (!cancelled) setBookingDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [bookingDetailPopover?.bookingId])

  useEffect(() => {
    if (!bookingDetailPopover) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setBookingDetailPopover(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bookingDetailPopover])

  const units = useMemo(() => (Array.isArray(data?.units) ? data.units : []), [data])
  const flatUnits = useMemo(
    () =>
      units.map((u) => ({
        id: u.id,
        name: u.name,
        type: u.type,
        propertyId: u.propertyId,
        propertyName: u.propertyName,
        bedrooms: u.bedrooms,
        beds: u.beds,
        maxGuests: u.maxGuests,
      })),
    [units],
  )
  const grouped = useMemo(() => groupUnitsByAccommodation(units), [units])
  const acceptedBookings = useMemo(() => {
    const raw = Array.isArray(acceptedQueueRaw) ? acceptedQueueRaw : []
    const rows = raw
      .filter((b) => isAcceptedStatus(b?.status))
      .map((b) => normalizeAssignmentBooking(b, units))
    rows.sort((a, b) => {
      const aKey = `${a.checkIn || ''}-${a.id || ''}`
      const bKey = `${b.checkIn || ''}-${b.id || ''}`
      return aKey.localeCompare(bKey)
    })
    return rows
  }, [acceptedQueueRaw, units])
  const [expandedAccommodationKeys, setExpandedAccommodationKeys] = useState(() => new Set())

  useEffect(() => {
    setExpandedAccommodationKeys((prev) => {
      const next = new Set(prev)
      for (const group of grouped) {
        if (!next.has(group.key)) next.add(group.key)
      }
      for (const key of [...next]) {
        if (!grouped.some((group) => group.key === key)) {
          next.delete(key)
        }
      }
      return next
    })
  }, [grouped])

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [modalInitial, setModalInitial] = useState(null)
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [selectedAcceptedId, setSelectedAcceptedId] = useState(null)
  const [assignUnitId, setAssignUnitId] = useState(null)
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState(null)
  const [assignNotice, setAssignNotice] = useState(null)
  const [acceptedSearch, setAcceptedSearch] = useState('')
  const [assignUnitMenuOpen, setAssignUnitMenuOpen] = useState(false)
  const [dragBooking, setDragBooking] = useState(null)
  const [dragMoving, setDragMoving] = useState(false)
  const [dragDropCandidate, setDragDropCandidate] = useState(null)
  const [dragDropError, setDragDropError] = useState(null)
  const assignUnitMenuRef = useRef(null)

  const filteredAcceptedBookings = useMemo(() => {
    const q = acceptedSearch.trim().toLowerCase()
    if (!q) return acceptedBookings
    return acceptedBookings.filter((b) => {
      const extraRefs = Array.isArray(b.batchBookings) ? b.batchBookings.map((line) => line?.reference).filter(Boolean) : []
      const hay = [
        b?.guestName,
        b?.propertyName,
        b?.reference,
        ...extraRefs,
        b?.checkIn,
        b?.checkOut,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [acceptedBookings, acceptedSearch])

  const selectedAccepted = useMemo(
    () => acceptedBookings.find((b) => String(b.id) === String(selectedAcceptedId)) ?? acceptedBookings[0] ?? null,
    [acceptedBookings, selectedAcceptedId],
  )

  useEffect(() => {
    if (!selectedAccepted) {
      setAssignUnitId(null)
      return
    }
    setAssignUnitId((prev) => (prev == null ? selectedAccepted.unitId : prev))
  }, [selectedAccepted])

  function unitCanHostPending(unit, pending) {
    if (!pending?.checkIn || !pending?.checkOut) return false
    if (!unitSpecMatches(unit, pending)) return false
    const hasAssignedOverlap = (unit?.bookings || []).some((b) => {
      if (String(b.id) === String(pending.id)) return false
      if (!isTimelineOccupyingBookingStatus(b?.status)) return false
      return b?.checkIn && b?.checkOut && stayRangesOverlap(pending.checkIn, pending.checkOut, b.checkIn, b.checkOut)
    })
    if (hasAssignedOverlap) return false
    const hasBlockOverlap = (unit?.blocks || []).some(
      (k) => k?.startDate && k?.endDate && stayRangesOverlap(pending.checkIn, pending.checkOut, k.startDate, k.endDate),
    )
    return !hasBlockOverlap
  }

  function canPlaceBookingOnUnit(unit, bookingId, checkIn, checkOut) {
    if (!unit || !checkIn || !checkOut || checkOut <= checkIn) return false
    const hasBookingOverlap = (unit?.bookings || []).some((b) => {
      if (String(b?.id) === String(bookingId)) return false
      if (!isTimelineOccupyingBookingStatus(b?.status)) return false
      return b?.checkIn && b?.checkOut && stayRangesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)
    })
    if (hasBookingOverlap) return false
    const hasBlockOverlap = (unit?.blocks || []).some(
      (k) => k?.startDate && k?.endDate && stayRangesOverlap(checkIn, checkOut, k.startDate, k.endDate),
    )
    return !hasBlockOverlap
  }

  function handleDropBooking(unit, targetCheckIn) {
    if (!dragBooking || !unit || !targetCheckIn) return
    if (!unitSpecMatches(unit, dragBooking.specTemplate)) {
      setDragDropError('This unit does not match the booking specs. Choose a room with the same type, beds, bedrooms, and max guests.')
      setDragBooking(null)
      return
    }
    const nights = Math.max(1, Number(dragBooking.nights) || 1)
    const targetCheckOut = addDaysYmd(targetCheckIn, nights)
    if (!canPlaceBookingOnUnit(unit, dragBooking.bookingId, targetCheckIn, targetCheckOut)) {
      setDragDropError('Cannot move booking there. Target dates overlap another booking or a blocked period.')
      setDragBooking(null)
      return
    }
    setDragDropCandidate({
      bookingId: dragBooking.bookingId,
      guestName: dragBooking.guestName,
      unitId: unit.id,
      unitName: unit.name,
      checkIn: targetCheckIn,
      checkOut: targetCheckOut,
    })
    setDragBooking(null)
  }

  async function handleConfirmDropMove() {
    if (!dragDropCandidate) return
    setAssigning(true)
    setDragMoving(true)
    setAssignError(null)
    setAssignNotice(null)
    try {
      await apiFetch(`/v1/bookings/${dragDropCandidate.bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          unitId: Number(dragDropCandidate.unitId),
          checkIn: dragDropCandidate.checkIn,
          checkOut: dragDropCandidate.checkOut,
        }),
      })
      setAssignNotice(
        `Moved ${dragDropCandidate.guestName} to ${dragDropCandidate.unitName} (${dragDropCandidate.checkIn} → ${dragDropCandidate.checkOut}).`,
      )
      await load()
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Could not move booking.')
    } finally {
      setAssigning(false)
      setDragMoving(false)
      setDragDropCandidate(null)
    }
  }

  const assignableUnitsForSelected = useMemo(() => {
    if (!selectedAccepted) return []
    return units.filter((u) => unitCanHostPending(u, selectedAccepted))
  }, [units, selectedAccepted])

  useEffect(() => {
    if (assignableUnitsForSelected.length === 0) {
      return
    }
    const exists = assignableUnitsForSelected.some((u) => String(u.id) === String(assignUnitId))
    if (!exists) {
      setAssignUnitId(assignableUnitsForSelected[0].id)
    }
  }, [assignableUnitsForSelected, assignUnitId])

  useEffect(() => {
    setAssignUnitMenuOpen(false)
  }, [selectedAcceptedId, selectedAccepted?.id])

  useEffect(() => {
    if (!assignUnitMenuOpen) return undefined
    function onDocMouseDown(e) {
      const node = assignUnitMenuRef.current
      if (node && !node.contains(e.target)) {
        setAssignUnitMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [assignUnitMenuOpen])

  function openCreate() {
    const today = toYmd(new Date())
    setModalMode('create')
    setModalInitial({
      unitId: flatUnits[0]?.id,
      startDate: today,
      endDate: addDaysYmd(today, 1),
      label: 'Blocked',
      notes: '',
    })
    setModalError(null)
    setModalOpen(true)
  }

  function openEditBlock(block, unitId) {
    setModalMode('edit')
    setModalInitial({
      id: block.id,
      unitId,
      startDate: block.startDate,
      endDate: block.endDate,
      label: block.label,
      notes: block.notes ?? '',
    })
    setModalError(null)
    setModalOpen(true)
  }

  async function handleSaveBlock(payload) {
    setModalSaving(true)
    setModalError(null)
    try {
      const unit = flatUnits.find((u) => String(u.id) === String(payload.unitId))
      if (unit && blockRangeOverlapsUnitTimelineBookings(unit, payload.startDate, payload.endDate)) {
        setModalError(
          'This range overlaps an existing reservation on this unit. Change the dates or update the booking first.',
        )
        return
      }
      if (modalMode === 'create') {
        await apiFetch('/v1/unit-date-blocks', {
          method: 'POST',
          body: JSON.stringify({
            unitId: payload.unitId,
            startDate: payload.startDate,
            endDate: payload.endDate,
            label: payload.label,
            notes: payload.notes,
          }),
        })
      } else {
        await apiFetch(`/v1/unit-date-blocks/${payload.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            startDate: payload.startDate,
            endDate: payload.endDate,
            label: payload.label,
            notes: payload.notes,
          }),
        })
      }
      setModalOpen(false)
      await load()
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setModalSaving(false)
    }
  }

  async function handleDeleteBlock(id) {
    if (!id) return
    const ok = window.confirm('Remove this blocked period?')
    if (!ok) return
    setModalSaving(true)
    setModalError(null)
    try {
      await apiFetch(`/v1/unit-date-blocks/${id}`, { method: 'DELETE' })
      setModalOpen(false)
      await load()
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Delete failed.')
    } finally {
      setModalSaving(false)
    }
  }

  function closeBookingDetailPopover() {
    setBookingDetailPopover(null)
    setBookingUnassigning(false)
    setBookingCheckingIn(false)
    setBookingCheckingOut(false)
    setBookingNotesSaving(false)
    setBookingMoving(false)
  }

  function handleBookingPopoverNavigateDetails() {
    const id = bookingDetailPopover?.bookingId
    if (id) navigate(`/bookings/${id}`)
    closeBookingDetailPopover()
  }

  async function handleBookingPopoverUnassign() {
    const id = bookingDetailPopover?.bookingId
    if (!id) return
    setBookingDetailError(null)
    setBookingUnassigning(true)
    try {
      await apiFetch(`/v1/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' }),
      })
      closeBookingDetailPopover()
      await load()
    } catch (e) {
      setBookingDetailError(e instanceof Error ? e.message : 'Could not update booking.')
    } finally {
      setBookingUnassigning(false)
    }
  }

  async function handleBookingPopoverCheckIn() {
    const id = bookingDetailPopover?.bookingId
    if (!id) return
    setBookingDetailError(null)
    setBookingCheckingIn(true)
    try {
      await apiFetch(`/v1/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'checked_in' }),
      })
      closeBookingDetailPopover()
      await load()
    } catch (e) {
      setBookingDetailError(e instanceof Error ? e.message : 'Could not update booking.')
    } finally {
      setBookingCheckingIn(false)
    }
  }

  async function handleBookingPopoverCheckOut() {
    const id = bookingDetailPopover?.bookingId
    if (!id) return
    setBookingDetailError(null)
    setBookingCheckingOut(true)
    try {
      await apiFetch(`/v1/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'checked_out' }),
      })
      closeBookingDetailPopover()
      await load()
    } catch (e) {
      setBookingDetailError(e instanceof Error ? e.message : 'Could not update booking.')
    } finally {
      setBookingCheckingOut(false)
    }
  }

  async function handleBookingPopoverSaveNotes(nextNotes) {
    const id = bookingDetailPopover?.bookingId
    if (!id) return
    setBookingDetailError(null)
    setBookingNotesSaving(true)
    try {
      const updated = await apiFetch(`/v1/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: nextNotes }),
      })
      setBookingDetailPayload(updated)
      await load()
    } catch (e) {
      setBookingDetailError(e instanceof Error ? e.message : 'Could not save notes.')
      throw e
    } finally {
      setBookingNotesSaving(false)
    }
  }

  async function handleBookingPopoverMove({ unitId, checkIn, checkOut }) {
    const id = bookingDetailPopover?.bookingId
    if (!id) return
    setBookingDetailError(null)
    setBookingMoving(true)
    try {
      const updated = await apiFetch(`/v1/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          unitId: Number(unitId),
          checkIn,
          checkOut,
        }),
      })
      setBookingDetailPayload(updated)
      await load()
    } catch (e) {
      setBookingDetailError(e instanceof Error ? e.message : 'Could not move booking.')
      throw e
    } finally {
      setBookingMoving(false)
    }
  }

  async function handleAssignSelected() {
    if (!selectedAccepted || !assignUnitId) return
    setAssigning(true)
    setAssignError(null)
    setAssignNotice(null)
    try {
      await apiFetch(`/v1/bookings/${selectedAccepted.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          unitId: Number(assignUnitId),
          status: 'assigned',
        }),
      })
      setAssignNotice(`Assigned ${selectedAccepted.guestName} to selected unit.`)
      await load()
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Could not assign accepted booking.')
    } finally {
      setAssigning(false)
    }
  }

  async function handleAutoAssignAll() {
    if (acceptedBookings.length === 0) return
    setAssigning(true)
    setAssignError(null)
    setAssignNotice(null)
    let done = 0
    let failed = 0
    for (const pending of acceptedBookings) {
      const options = units.filter((u) => unitCanHostPending(u, pending))
      const target = options[0]
      if (!target) {
        failed += 1
        continue
      }
      try {
        await apiFetch(`/v1/bookings/${pending.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            unitId: Number(target.id),
            status: 'assigned',
          }),
        })
        done += 1
      } catch {
        failed += 1
      }
    }
    await load()
    setAssigning(false)
    if (done > 0 && failed === 0) {
      setAssignNotice(`Auto-assign complete: ${done} booking(s) assigned.`)
    } else if (done > 0 && failed > 0) {
      setAssignNotice(`Auto-assign partial: ${done} assigned, ${failed} skipped.`)
    } else {
      setAssignError('No accepted bookings could be auto-assigned with current availability.')
    }
  }

  function shiftWeeks(delta) {
    setAnchor((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + delta * 7)
      return d
    })
  }

  function goToday() {
    setAnchor(new Date())
  }

  const dayCount = Math.max(1, dayHeaders.length)
  const timelineGridStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }),
    [dayCount],
  )

  function barPositionStyle(startIdx, span) {
    const start = Number.isFinite(startIdx) ? Number(startIdx) : 0
    const s = Number.isFinite(span) ? Math.max(0.2, Number(span)) : 1
    return {
      left: `calc(100% * ${start} / ${dayCount})`,
      width: `calc(100% * ${s} / ${dayCount})`,
    }
  }

  const acceptedCountByDay = useMemo(() => {
    const map = new Map(dayHeaders.map((d) => [d, 0]))
    for (const b of acceptedBookings) {
      if (!b?.checkIn) continue
      if (!map.has(b.checkIn)) continue
      map.set(b.checkIn, (map.get(b.checkIn) ?? 0) + 1)
    }
    return map
  }, [acceptedBookings, dayHeaders])

  function isUnitAvailableForPendingOnDay(unit, ymd) {
    if ((acceptedCountByDay.get(ymd) ?? 0) === 0) return false
    const dayEnd = addDaysYmd(ymd, 1)
    const hasOccupyingBooking = (unit?.bookings || []).some(
      (b) =>
        isTimelineOccupyingBookingStatus(b?.status) &&
        b?.checkIn &&
        b?.checkOut &&
        stayRangesOverlap(ymd, dayEnd, b.checkIn, b.checkOut),
    )
    if (hasOccupyingBooking) return false
    const hasBlock = (unit?.blocks || []).some(
      (k) => k?.startDate && k?.endDate && stayRangesOverlap(ymd, dayEnd, k.startDate, k.endDate),
    )
    return !hasBlock
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0f3f73]">Availability calendar</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Only accepted bookings appear in Assignments. Pending bookings are excluded until they are accepted.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={flatUnits.length === 0}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Block dates
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={() => shiftWeeks(-1)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={goToday}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-black text-[#2B5AED] hover:bg-slate-50"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => shiftWeeks(1)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          Next →
        </button>
        <span className="ml-auto text-xs font-semibold tabular-nums text-slate-500">
          {fromYmd} → {addDaysYmd(toYmdExclusive, -1)}
        </span>
      </div>

      <div className="min-h-0 flex-1 grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:flex xl:flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
            <div>
              <p className="text-sm font-black text-[#0f3f73]">Assignments</p>
              <p className="text-[11px] text-slate-500">
                Accepted: {acceptedBookings.length}
                {acceptedSearch.trim() ? ` · Showing ${filteredAcceptedBookings.length}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleAutoAssignAll()}
              disabled={assigning || acceptedBookings.length === 0}
              className="rounded-lg bg-[#22c7b8] px-2.5 py-1.5 text-xs font-black text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              {assigning ? 'Assigning…' : 'Auto assign all'}
            </button>
          </div>
          <div className="border-b border-slate-100 p-3">
            <input
              type="text"
              value={acceptedSearch}
              onChange={(e) => setAcceptedSearch(e.target.value)}
              placeholder="Search accepted bookings…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="space-y-2 border-b border-slate-100 p-3 max-h-[46vh] overflow-y-auto xl:max-h-none xl:min-h-0 xl:flex-1">
            {filteredAcceptedBookings.length === 0 ? (
              <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-5 text-sm text-slate-500">No accepted bookings.</p>
            ) : (
              filteredAcceptedBookings.map((b) => {
                const active = String(selectedAccepted?.id) === String(b.id)
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedAcceptedId(b.id)}
                    className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                      active ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">{b.guestName}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {b.propertyName || 'Accommodation'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {ymdLabel(b.checkIn)} → {ymdLabel(b.checkOut)}
                    </p>
                  </button>
                )
              })
            )}
          </div>
          <div className="p-3">
            {selectedAccepted ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Assign selected accepted</p>
                <p className="mt-1 text-sm font-black text-slate-900">{selectedAccepted.guestName}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {selectedAccepted.propertyName || 'Accommodation'}
                </p>
                <p className="text-[11px] text-slate-600">
                  {ymdLabel(selectedAccepted.checkIn)} → {ymdLabel(selectedAccepted.checkOut)}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-600">{bookingSpecLabel(selectedAccepted)}</p>
                <label className="mt-2 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Unit
                  <div ref={assignUnitMenuRef} className="relative mt-1">
                    <button
                      type="button"
                      onClick={() => setAssignUnitMenuOpen((v) => !v)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-800"
                    >
                      <span className="truncate">
                        {(() => {
                          const current = assignableUnitsForSelected.find((u) => String(u.id) === String(assignUnitId))
                          return current ? (current.propertyName ? `${current.propertyName} · ` : '') + current.name : 'Select unit'
                        })()}
                      </span>
                      <span className="ml-2 text-slate-500" aria-hidden>
                        ▾
                      </span>
                    </button>
                    {assignUnitMenuOpen ? (
                      <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {assignableUnitsForSelected.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setAssignUnitId(String(u.id))
                              setAssignUnitMenuOpen(false)
                            }}
                            className={`block w-full px-2.5 py-2 text-left text-sm font-semibold ${
                              String(assignUnitId) === String(u.id)
                                ? 'bg-[#2b5aed] text-white'
                                : 'text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            {(u.propertyName ? `${u.propertyName} · ` : '') + u.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </label>
                {assignableUnitsForSelected.length === 0 ? (
                  <p className="mt-2 text-xs font-medium text-rose-700">
                    No available unit matches this booking spec and stay range.
                  </p>
                ) : null}
                {assignError ? <p className="mt-2 text-xs font-medium text-rose-700">{assignError}</p> : null}
                {assignNotice ? <p className="mt-2 text-xs font-medium text-emerald-700">{assignNotice}</p> : null}
                <button
                  type="button"
                  onClick={() => void handleAssignSelected()}
                  disabled={assigning || !assignUnitId || assignableUnitsForSelected.length === 0}
                  className="mt-3 w-full rounded-lg bg-[#2b5aed] px-3 py-2 text-sm font-black text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                >
                  Assign
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select an accepted booking to assign.</p>
            )}
          </div>
        </aside>

        <div className="min-h-0 flex flex-col gap-4">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex h-full min-h-[420px] flex-col overflow-auto">
          <div className="sticky top-0 z-20 flex min-w-0 border-b border-slate-200 bg-[#f8fafc]">
            <div className="sticky left-0 z-30 w-[220px] shrink-0 border-r border-slate-200 bg-[#f8fafc] px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
              Units
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="grid w-full min-w-0" style={timelineGridStyle}>
                {dayHeaders.map((ymd) => {
                  const dt = parseYmd(ymd)
                  const label = dt
                    ? dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
                    : ymd
                  const month = dt ? dt.toLocaleDateString(undefined, { month: 'short' }) : ''
                  return (
                    <div
                      key={ymd}
                      className="min-w-0 border-r border-slate-200 px-0.5 py-2 text-center last:border-r-0"
                    >
                      {(acceptedCountByDay.get(ymd) ?? 0) > 0 ? (
                        <div className="mx-auto mb-0.5 inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
                          {acceptedCountByDay.get(ymd)}
                        </div>
                      ) : (
                        <div className="mb-0.5 h-[1.15rem]" />
                      )}
                      <div className="truncate text-[9px] font-bold uppercase text-slate-400">{month}</div>
                      <div className="truncate text-[10px] font-black tabular-nums text-slate-700">{label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center text-sm font-medium text-slate-500">Loading calendar…</div>
          ) : units.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-slate-600">
              <p>No active units yet.</p>
              <p className="text-xs text-slate-500">Add units under Configuration to start blocking dates.</p>
            </div>
          ) : (
            grouped.map((group) => {
              const isExpanded = expandedAccommodationKeys.has(group.key)
              return (
              <div key={group.key} className="min-w-0">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedAccommodationKeys((prev) => {
                      const next = new Set(prev)
                      if (next.has(group.key)) {
                        next.delete(group.key)
                      } else {
                        next.add(group.key)
                      }
                      return next
                    })
                  }
                  className="sticky left-0 z-10 flex w-full items-center justify-between border-b border-slate-100 bg-slate-100 px-3 py-1.5 text-left text-xs font-black uppercase tracking-wide text-slate-600 hover:bg-slate-200/70"
                  aria-expanded={isExpanded}
                >
                  <span>{group.label}</span>
                  <span className="text-sm leading-none">{isExpanded ? '▾' : '▸'}</span>
                </button>
                {isExpanded
                  ? group.rows.map((unit) => {
                  return (
                    <div key={unit.id} className="flex min-w-0 border-b border-slate-100">
                      <div className="sticky left-0 z-10 w-[220px] shrink-0 border-r border-slate-200 bg-white px-3 py-1.5">
                        <p className="text-sm font-bold text-slate-900">{unit.name}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500">
                          {unitSpecsSubtitle(unit)}
                        </p>
                      </div>
                      <div className="relative min-h-[40px] min-w-0 flex-1 overflow-hidden bg-white">
                        <div
                          className="pointer-events-none absolute inset-0 grid h-full w-full min-w-0"
                          style={timelineGridStyle}
                          aria-hidden="true"
                        >
                          {dayHeaders.map((ymd) => (
                            <div
                              key={ymd}
                              className={`min-w-0 border-r border-slate-50 last:border-r-0 ${
                                isUnitAvailableForPendingOnDay(unit, ymd) ? 'bg-amber-100/70' : ''
                              }`}
                            />
                          ))}
                        </div>
                        <div className="relative min-h-[40px] w-full min-w-0">
                          {dragBooking ? (
                            <div className="absolute inset-0 z-[3] grid" style={timelineGridStyle}>
                              {dayHeaders.map((ymd) => {
                                const dropCheckIn = ymd
                                const dropCheckOut = addDaysYmd(dropCheckIn, Math.max(1, Number(dragBooking.nights) || 1))
                                const canDrop = canPlaceBookingOnUnit(unit, dragBooking.bookingId, dropCheckIn, dropCheckOut)
                                return (
                                  <div
                                    key={`drop-${unit.id}-${ymd}`}
                                    className={`border-r last:border-r-0 ${
                                      canDrop ? 'bg-emerald-100/35' : 'bg-rose-100/35'
                                    }`}
                                    onDragOver={(e) => {
                                      e.preventDefault()
                                      e.dataTransfer.dropEffect = canDrop ? 'move' : 'none'
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault()
                                      if (dragMoving) return
                                      handleDropBooking(unit, ymd)
                                    }}
                                  />
                                )
                              })}
                            </div>
                          ) : null}
                          {(unit.bookings || []).map((b) => {
                            if (!isTimelineOccupyingBookingStatus(b?.status)) return null
                            if (!b.checkIn || !b.checkOut) return null
                            if (!stayRangesOverlap(fromYmd, toYmdExclusive, b.checkIn, b.checkOut)) return null
                            const rawStartIdx = dayHeaders.findIndex((d) => d >= b.checkIn)
                            const endIdxExclusive = dayHeaders.findIndex((d) => d >= b.checkOut)
                            const startInView = rawStartIdx !== -1
                            const startBase = startInView ? rawStartIdx : 0
                            const leftDiag = startInView && b.checkIn >= fromYmd
                            const startIdx = startBase + (leftDiag ? 0.5 : 0)
                            const checkoutInView = endIdxExclusive !== -1
                            const rightDiag = checkoutInView && b.checkOut < toYmdExclusive
                            const end = checkoutInView ? endIdxExclusive + (rightDiag ? 0.5 : 0) : dayHeaders.length
                            const span = Math.max(0.35, end - startIdx)
                            const clipPath = timelineBarClipPath({ leftDiag, rightDiag })
                            const balanceTitle = bookingHasBalanceDue(b)
                              ? ` · Balance due${b.currency != null && b.currency !== '' ? ` (${String(b.currency)})` : ''}`
                              : ''
                            return (
                              <div
                                key={`b-${b.id}`}
                                className="absolute top-[7px] z-[4] max-w-full"
                                style={barPositionStyle(startIdx, span)}
                              >
                                <button
                                  type="button"
                                  title={`${b.guestName} · ${b.reference}${balanceTitle}`}
                                  draggable={!dragMoving}
                                  className={`relative flex h-[26px] w-full max-w-full items-center overflow-hidden px-2 text-left text-[11px] font-semibold leading-tight tracking-tight ${bookingBarColor(b.status)}`}
                                  style={{ clipPath }}
                                  onDragStart={(e) => {
                                    const nights = Math.max(
                                      1,
                                      Math.round(
                                        (parseYmd(b.checkOut)?.getTime() - parseYmd(b.checkIn)?.getTime()) / (1000 * 60 * 60 * 24),
                                      ) || 1,
                                    )
                                    setDragBooking({
                                      bookingId: b.id,
                                      fromUnitId: unit.id,
                                      nights,
                                      guestName: b.guestName || 'Guest',
                                      specTemplate: {
                                        propertyId: unit?.propertyId ?? null,
                                        type: unit?.type,
                                        bedrooms: unit?.bedrooms ?? 0,
                                        beds: unit?.beds ?? 0,
                                        maxGuests: unit?.maxGuests ?? 0,
                                      },
                                    })
                                    e.dataTransfer.effectAllowed = 'move'
                                  }}
                                  onDragEnd={() => {
                                    setDragBooking(null)
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const wrap = e.currentTarget.parentElement
                                    if (!wrap) return
                                    const r = wrap.getBoundingClientRect()
                                    setBookingDetailPopover({
                                      bookingId: b.id,
                                      unit,
                                      calendarSummary: b,
                                      anchorRect: {
                                        top: r.top,
                                        left: r.left,
                                        width: r.width,
                                        height: r.height,
                                        bottom: r.bottom,
                                      },
                                    })
                                  }}
                                >
                                  <span className="truncate">{b.guestName}</span>
                                </button>
                                {bookingHasBalanceDue(b) ? (
                                  <span
                                    className="pointer-events-none absolute right-2.5 top-1 z-10 h-1.5 w-1.5 rounded-full bg-rose-500 ring-[1.5px] ring-white/95 shadow-sm"
                                    title={`Balance due${b.balanceDue != null ? `: ${b.balanceDue}` : ''}`}
                                    aria-hidden
                                  />
                                ) : null}
                              </div>
                            )
                          })}
                          {(unit.blocks || []).map((k) => {
                            if (!k.startDate || !k.endDate) return null
                            if (!stayRangesOverlap(fromYmd, toYmdExclusive, k.startDate, k.endDate)) return null
                            const rawStartIdxB = dayHeaders.findIndex((d) => d >= k.startDate)
                            const endIdxExclusiveB = dayHeaders.findIndex((d) => d >= k.endDate)
                            const startBaseB = rawStartIdxB !== -1 ? rawStartIdxB : 0
                            const leftDiagB = rawStartIdxB !== -1 && k.startDate >= fromYmd
                            const startIdxB = startBaseB + (leftDiagB ? 0.5 : 0)
                            const checkoutInViewB = endIdxExclusiveB !== -1
                            const rightDiagB = checkoutInViewB && k.endDate < toYmdExclusive
                            const endB = checkoutInViewB ? endIdxExclusiveB + (rightDiagB ? 0.5 : 0) : dayHeaders.length
                            const spanB = Math.max(0.35, endB - startIdxB)
                            const clipPathB = timelineBarClipPath({ leftDiag: leftDiagB, rightDiag: rightDiagB })
                            return (
                              <button
                                key={`k-${k.id}`}
                                type="button"
                                title={k.label}
                                onClick={() =>
                                  openEditBlock(
                                    {
                                      id: k.id,
                                      startDate: k.startDate,
                                      endDate: k.endDate,
                                      label: k.label,
                                      notes: k.notes ?? '',
                                    },
                                    unit.id,
                                  )
                                }
                                className="absolute top-[7px] z-[5] flex h-[26px] max-w-full items-center overflow-hidden bg-rose-700 px-2 text-left text-[11px] font-semibold leading-tight tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-rose-800"
                                style={{ ...barPositionStyle(startIdxB, spanB), clipPath: clipPathB }}
                              >
                                <span className="truncate">{k.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })
                  : null}
              </div>
            )})
          )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
                2
              </span>{' '}
              Accepted requests (check-in date)
            </span>
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="h-3 w-3 rounded-sm bg-amber-100 ring-1 ring-amber-300/70" /> Available for accepted assign
            </span>
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="h-3 w-3 rounded-sm bg-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" /> Assigned booking
            </span>
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="h-3 w-3 rounded-sm bg-violet-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" /> Checked in
            </span>
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="h-3 w-3 rounded-sm bg-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" /> Checked out
            </span>
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="h-3 w-3 rounded-sm bg-amber-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" /> Accepted · not assigned to this unit yet
            </span>
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="relative inline-flex h-3 w-3 items-center justify-center">
                <span className="h-3 w-3 rounded-sm bg-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
                <span className="absolute -right-0.5 top-0 h-1.5 w-1.5 rounded-full bg-rose-500 ring-[1px] ring-white" />
              </span>{' '}
              Rose dot — unpaid balance (total − recorded payments)
            </span>
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="h-3 w-3 rounded-sm bg-rose-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" /> Blocked (portal + manual guard)
            </span>
          </div>
        </div>
      </div>

      <BlockModal
        open={modalOpen}
        mode={modalMode}
        units={flatUnits}
        initial={modalInitial}
        saving={modalSaving}
        error={modalError}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
      />

      {dragDropCandidate ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
            <h4 className="text-sm font-black text-slate-900">Confirm move</h4>
            <p className="mt-1 text-xs text-slate-600">
              Move <span className="font-bold">{dragDropCandidate.guestName}</span> to{' '}
              <span className="font-bold">{dragDropCandidate.unitName}</span> from{' '}
              <span className="font-semibold">{dragDropCandidate.checkIn}</span> to{' '}
              <span className="font-semibold">{dragDropCandidate.checkOut}</span>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={dragMoving}
                onClick={() => setDragDropCandidate(null)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dragMoving}
                onClick={() => void handleConfirmDropMove()}
                className="rounded-md bg-[#2b5aed] px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {dragMoving ? 'Moving…' : 'Confirm move'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dragDropError ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-sm rounded-xl border border-rose-200 bg-white p-4 shadow-2xl">
            <h4 className="text-sm font-black text-rose-700">Move not allowed</h4>
            <p className="mt-1 text-xs text-slate-700">{dragDropError}</p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setDragDropError(null)}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-bold text-white"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CalendarBookingDetailPopover
        open={Boolean(bookingDetailPopover)}
        anchorRect={bookingDetailPopover?.anchorRect ?? null}
        unitName={bookingDetailPopover?.unit?.name}
        moveUnits={flatUnits}
        calendarSummary={bookingDetailPopover?.calendarSummary}
        detail={bookingDetailPayload}
        loading={bookingDetailLoading}
        fetchError={bookingDetailError}
        onClose={closeBookingDetailPopover}
        onNavigateDetails={handleBookingPopoverNavigateDetails}
        onUnassign={handleBookingPopoverUnassign}
        onCheckIn={handleBookingPopoverCheckIn}
        onCheckOut={handleBookingPopoverCheckOut}
        onSaveNotes={handleBookingPopoverSaveNotes}
        notesSaving={bookingNotesSaving}
        onMoveBooking={handleBookingPopoverMove}
        movingBooking={bookingMoving}
        checkingIn={bookingCheckingIn}
        checkingOut={bookingCheckingOut}
        unassigning={bookingUnassigning}
      />
    </div>
  )
}

export default CalendarPage
