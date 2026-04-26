import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../utils/api'
import {
  DetailRow,
  formatMoney,
  formatYmdToDisplay,
  sourceLabel,
  specDisplay,
  statusBadgeClass,
  statusLabel,
} from './bookingsCommon'

/** @param {string | null | undefined} iso */
function formatIsoDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Sum of all units when this booking is part of a direct-portal multi-unit batch; otherwise same as `totalPrice`. */
function bookingBatchPriceTotal(row) {
  if (row?.batchTotalPrice != null && Number.isFinite(Number(row.batchTotalPrice))) {
    return Number(row.batchTotalPrice)
  }
  return row?.totalPrice
}

/** Unit column: count only for multi-unit portal batches; names stay on the Units tab. */
function bookingUnitDisplayLabel(row) {
  const batchLen = Array.isArray(row?.batchBookings) ? row.batchBookings.length : 0
  if (row?.portalBatchId && batchLen > 1) {
    return `${batchLen} units`
  }
  if (row.status === 'pending' || row.status === 'cancelled') return 'N/A'
  return row.unitName ?? '—'
}

const DETAIL_TABS_STANDARD = [
  { id: 'information', label: 'Information' },
  { id: 'payment', label: 'Payment' },
  { id: 'history', label: 'History' },
]

const PAYMENT_TYPE_OPTIONS = [
  { value: 'gcash', label: 'GCash' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
]

function paymentTypeLabel(type) {
  const row = PAYMENT_TYPE_OPTIONS.find((o) => o.value === type)
  return row?.label ?? type?.replace(/_/g, ' ') ?? '—'
}

function transactionKindLabel(kind) {
  if (kind === 'refund') return 'Refund'
  return 'Payment'
}

const BOOKING_SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking_com', label: 'Booking.com' },
  { value: 'expedia', label: 'Expedia' },
  { value: 'vrbo', label: 'VRBO' },
  { value: 'direct_portal', label: 'Direct portal' },
]

function infoFormFromRow(r) {
  if (!r) {
    return {
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      checkIn: '',
      checkOut: '',
      adults: '1',
      children: '0',
      source: 'manual',
      notes: '',
      totalPrice: '',
    }
  }
  return {
    guestName: r.guestName ?? '',
    guestEmail: r.guestEmail ?? '',
    guestPhone: r.guestPhone ?? '',
    checkIn: r.checkIn ?? '',
    checkOut: r.checkOut ?? '',
    adults: String(r.adults ?? 1),
    children: String(r.children ?? 0),
    source: r.source ?? 'manual',
    notes: r.notes ?? '',
    totalPrice: r.totalPrice != null && Number.isFinite(Number(r.totalPrice)) ? String(r.totalPrice) : '',
  }
}

function BookingDetailPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const id = bookingId && /^\d+$/.test(bookingId) ? Number(bookingId) : null

  const [row, setRow] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(true)

  const [viewError, setViewError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [availableUnits, setAvailableUnits] = useState([])
  const [availableUnitsLoading, setAvailableUnitsLoading] = useState(false)
  const [detailTab, setDetailTab] = useState('information')

  const detailTabs = useMemo(() => {
    const showUnitsTab = row?.source === 'direct_portal'
    if (showUnitsTab) {
      return [
        { id: 'information', label: 'Information' },
        { id: 'units', label: 'Units' },
        { id: 'payment', label: 'Payment' },
        { id: 'history', label: 'History' },
      ]
    }
    return DETAIL_TABS_STANDARD
  }, [row?.source])

  useEffect(() => {
    const showUnitsTab = row?.source === 'direct_portal'
    if (!showUnitsTab && detailTab === 'units') {
      setDetailTab('information')
    }
  }, [row, detailTab])

  const unitTabLines = useMemo(() => {
    if (!row) return []
    if (Array.isArray(row.batchBookings) && row.batchBookings.length > 0) {
      return row.batchBookings
    }
    return [
      {
        id: row.id,
        reference: row.reference,
        unitName: row.unitName,
        totalPrice: row.totalPrice,
      },
    ]
  }, [row])

  const [paymentSummary, setPaymentSummary] = useState(null)
  const [paymentsList, setPaymentsList] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState(null)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    paymentType: 'gcash',
    amount: '',
    notes: '',
  })

  const [infoEditing, setInfoEditing] = useState(false)
  const [infoForm, setInfoForm] = useState(() => infoFormFromRow(null))
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoSaveError, setInfoSaveError] = useState(null)
  const [deletingUnitBookingId, setDeletingUnitBookingId] = useState(null)
  const [unitDeleteConfirm, setUnitDeleteConfirm] = useState(null)

  const loadBooking = useCallback(async () => {
    if (id == null) {
      setLoadError('Invalid booking.')
      setLoading(false)
      setRow(null)
      return
    }
    setLoadError(null)
    setLoading(true)
    try {
      const data = await apiFetch(`/v1/bookings/${id}`)
      if (data && typeof data === 'object' && data.id != null) {
        setRow(data)
      } else {
        setRow(null)
        setLoadError('Booking not found.')
      }
    } catch (e) {
      setRow(null)
      setLoadError(e instanceof Error ? e.message : 'Could not load booking.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadBooking()
  }, [loadBooking])

  useEffect(() => {
    setDetailTab('information')
    setPaymentSummary(null)
    setPaymentsList([])
    setPaymentsError(null)
    setPaymentForm({ paymentType: 'gcash', amount: '', notes: '' })
    setInfoEditing(false)
    setInfoSaveError(null)
    setInfoForm(infoFormFromRow(null))
    setDeletingUnitBookingId(null)
    setUnitDeleteConfirm(null)
  }, [id])

  const loadPayments = useCallback(async () => {
    if (id == null) {
      return
    }
    setPaymentsError(null)
    setPaymentsLoading(true)
    try {
      const data = await apiFetch(`/v1/bookings/${id}/payments`)
      if (data?.summary && typeof data.summary === 'object') {
        setPaymentSummary(data.summary)
      } else {
        setPaymentSummary(null)
      }
      setPaymentsList(Array.isArray(data?.payments) ? data.payments : [])
    } catch (e) {
      setPaymentSummary(null)
      setPaymentsList([])
      setPaymentsError(e instanceof Error ? e.message : 'Could not load payments.')
    } finally {
      setPaymentsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id == null || detailTab !== 'payment') {
      return
    }
    void loadPayments()
  }, [id, detailTab, loadPayments])

  useEffect(() => {
    if (detailTab !== 'information') {
      setInfoEditing(false)
      setInfoSaveError(null)
    }
  }, [detailTab])

  useEffect(() => {
    if (row == null || id == null) {
      setAvailableUnits([])
      return
    }
    if (row.status !== 'pending' && row.status !== 'accepted') {
      setAvailableUnits([])
      return
    }
    let cancelled = false
    setAvailableUnitsLoading(true)
    ;(async () => {
      try {
        const data = await apiFetch(`/v1/bookings/${id}/available-units`)
        if (!cancelled && Array.isArray(data?.units)) {
          setAvailableUnits(data.units)
        }
      } catch {
        if (!cancelled) {
          setAvailableUnits([])
        }
      } finally {
        if (!cancelled) {
          setAvailableUnitsLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, row?.id, row?.status])

  function beginInfoEdit() {
    if (!row) {
      return
    }
    setInfoForm(infoFormFromRow(row))
    setInfoSaveError(null)
    setInfoEditing(true)
  }

  function cancelInfoEdit() {
    if (row) {
      setInfoForm(infoFormFromRow(row))
    }
    setInfoSaveError(null)
    setInfoEditing(false)
  }

  async function handleSaveInfo(e) {
    e.preventDefault()
    if (!row || id == null) {
      return
    }
    const guestName = infoForm.guestName.trim()
    const guestEmail = infoForm.guestEmail.trim()
    const guestPhone = infoForm.guestPhone.trim()
    if (!guestName || !guestEmail || !guestPhone) {
      setInfoSaveError('Guest name, email, and phone are required.')
      return
    }
    const adults = parseInt(infoForm.adults, 10)
    const children = parseInt(infoForm.children, 10)
    if (!Number.isFinite(adults) || adults < 1 || !Number.isFinite(children) || children < 0) {
      setInfoSaveError('Enter valid guest counts.')
      return
    }
    if (!infoForm.checkIn || !infoForm.checkOut) {
      setInfoSaveError('Check-in and check-out dates are required.')
      return
    }
    setSavingInfo(true)
    setInfoSaveError(null)
    const payload = {
      guestName,
      guestEmail,
      guestPhone,
      checkIn: infoForm.checkIn,
      checkOut: infoForm.checkOut,
      adults,
      children,
      source: infoForm.source,
      notes: infoForm.notes.trim() || null,
    }
    const tp = infoForm.totalPrice.trim()
    if (tp !== '') {
      const n = Number(tp)
      if (!Number.isFinite(n) || n < 0) {
        setInfoSaveError('Total price must be a valid number.')
        setSavingInfo(false)
        return
      }
      payload.totalPrice = n
    }
    try {
      const data = await apiFetch(`/v1/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (data && typeof data === 'object') {
        setRow((prev) => (prev ? { ...prev, ...data } : prev))
      }
      setInfoEditing(false)
    } catch (err) {
      setInfoSaveError(err instanceof Error ? err.message : 'Could not save changes.')
    } finally {
      setSavingInfo(false)
    }
  }

  async function handleRecordPayment(e) {
    e.preventDefault()
    if (!row || id == null) {
      return
    }
    const actionKind = e?.nativeEvent?.submitter?.value === 'refund' ? 'refund' : 'payment'
    const raw = paymentForm.amount.trim()
    const amount = raw === '' ? NaN : Number(raw)
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentsError('Enter a valid payment amount.')
      return
    }
    if (
      actionKind === 'refund'
      && amount > Number(paymentSummary?.refundableAmount ?? paymentSummary?.netPaid ?? 0)
    ) {
      setPaymentsError('Refund amount cannot exceed paid amount available for refund.')
      return
    }
    setPaymentSaving(true)
    setPaymentsError(null)
    try {
      const data = await apiFetch(`/v1/bookings/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount,
          paymentType: paymentForm.paymentType,
          transactionKind: actionKind,
          notes: paymentForm.notes.trim() || null,
        }),
      })
      if (data?.summary && typeof data.summary === 'object') {
        setPaymentSummary(data.summary)
      }
      setPaymentsList(Array.isArray(data?.payments) ? data.payments : [])
      setPaymentForm((f) => ({ ...f, amount: '', notes: '' }))
    } catch (e) {
      setPaymentsError(
        e instanceof Error
          ? e.message
          : actionKind === 'refund'
            ? 'Could not record refund.'
            : 'Could not record payment.',
      )
    } finally {
      setPaymentSaving(false)
    }
  }

  async function handleSetStatus(status) {
    if (!row || id == null) {
      return
    }
    setSaving(true)
    setViewError(null)
    try {
      const data = await apiFetch(`/v1/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      if (data && typeof data === 'object') {
        setRow((prev) => (prev ? { ...prev, ...data } : prev))
      }
    } catch (e) {
      setViewError(e instanceof Error ? e.message : 'Could not update status.')
    } finally {
      setSaving(false)
    }
  }

  function openUnitDeleteConfirm(line) {
    if (!line?.id) return
    const lineId = Number(line.id)
    if (!Number.isFinite(lineId) || lineId <= 0) return
    setUnitDeleteConfirm({
      id: lineId,
      reference: typeof line.reference === 'string' ? line.reference : '',
    })
  }

  function closeUnitDeleteConfirm() {
    if (deletingUnitBookingId != null) return
    setUnitDeleteConfirm(null)
  }

  async function confirmDeleteUnitRequest() {
    if (!unitDeleteConfirm?.id) return
    const lineId = Number(unitDeleteConfirm.id)
    setUnitDeleteConfirm(null)
    setDeletingUnitBookingId(lineId)
    setViewError(null)
    try {
      await apiFetch(`/v1/bookings/${lineId}`, { method: 'DELETE' })
      if (id != null && lineId === id) {
        navigate('/bookings')
        return
      }
      await loadBooking()
      if (detailTab === 'payment') {
        await loadPayments()
      }
    } catch (e) {
      setViewError(e instanceof Error ? e.message : 'Could not delete booking request.')
    } finally {
      setDeletingUnitBookingId(null)
    }
  }

  const showAvailableUnits = row && (row.status === 'pending' || row.status === 'accepted')

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-4 sm:px-8 sm:py-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Link
              to="/bookings"
              className="w-fit text-sm font-bold text-[#1B4F8A] hover:underline"
            >
              ← Back to bookings
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#0f3f73]">Booking details</h1>
              <p className="mt-1 text-sm text-slate-500">Review guest information, matching units, and reservation status.</p>
            </div>
          </div>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {loadError}
            {id == null ? null : (
              <button
                type="button"
                onClick={() => void loadBooking()}
                className="ml-3 font-bold text-rose-900 underline"
              >
                Retry
              </button>
            )}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Loading…
          </div>
        ) : null}

        {!loading && row ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="space-y-4 xl:col-span-8">
              {viewError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{viewError}</div>
              ) : null}

              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
                <h2 className="text-2xl font-black leading-tight tracking-tight text-[#0f3f73] sm:text-3xl">
                  {infoEditing ? infoForm.guestName.trim() || '—' : row.guestName}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${statusBadgeClass(row.status)}`}
                  >
                    {statusLabel(row.status)}
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-500">{row.reference}</span>
                  {row.portalBatchId && Array.isArray(row.batchBookings) && row.batchBookings.length > 1 ? (
                    <span className="text-xs font-semibold text-slate-500">
                      · {row.batchBookings.length} units
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div
                  className="flex gap-1 border-b border-slate-100 px-2 pt-2 sm:gap-2 sm:px-4"
                  role="tablist"
                  aria-label="Booking sections"
                >
                  {detailTabs.map((tab) => {
                    const selected = detailTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        id={`booking-tab-${tab.id}`}
                        aria-controls={`booking-panel-${tab.id}`}
                        onClick={() => setDetailTab(tab.id)}
                        className={`relative -mb-px rounded-t-lg px-3 py-2.5 text-sm font-black transition sm:px-4 ${
                          selected
                            ? 'text-[#0f3f73] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#1B4F8A]'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                <div className="px-5 pb-3 pt-3">
                  {detailTab === 'information' ? (
                    <div
                      id="booking-panel-information"
                      role="tabpanel"
                      aria-labelledby="booking-tab-information"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-xs font-black uppercase tracking-wide text-slate-500">Reservation</h2>
                        {row.status !== 'cancelled' ? (
                          infoEditing ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={savingInfo}
                                onClick={cancelInfoEdit}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                form="booking-info-form"
                                disabled={savingInfo}
                                className="rounded-lg bg-[#1B4F8A] px-3 py-1.5 text-xs font-black text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                              >
                                {savingInfo ? 'Saving…' : 'Save changes'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={beginInfoEdit}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-[#0f3f73] shadow-sm hover:bg-slate-50"
                            >
                              Edit details
                            </button>
                          )
                        ) : null}
                      </div>
                      {infoSaveError ? (
                        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                          {infoSaveError}
                        </div>
                      ) : null}
                      {infoEditing ? (
                        <form
                          id="booking-info-form"
                          onSubmit={(ev) => void handleSaveInfo(ev)}
                          className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2"
                        >
                          <label className="flex flex-col gap-1 sm:col-span-2">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Guest name</span>
                            <input
                              required
                              value={infoForm.guestName}
                              onChange={(e) => setInfoForm((f) => ({ ...f, guestName: e.target.value }))}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Phone</span>
                            <input
                              required
                              value={infoForm.guestPhone}
                              onChange={(e) => setInfoForm((f) => ({ ...f, guestPhone: e.target.value }))}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1 sm:col-span-2">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</span>
                            <input
                              required
                              type="email"
                              value={infoForm.guestEmail}
                              onChange={(e) => setInfoForm((f) => ({ ...f, guestEmail: e.target.value }))}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <div className="border-b border-slate-200 pb-3 sm:col-span-2">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">From unit template</p>
                            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                              <p>
                                <span className="text-slate-500">Accommodation: </span>
                                <span className="font-semibold text-slate-800">{specDisplay(row.accommodationName)}</span>
                              </p>
                              <p>
                                <span className="text-slate-500">Type: </span>
                                <span className="font-semibold text-slate-800">{specDisplay(row.unitType)}</span>
                              </p>
                              <p>
                                <span className="text-slate-500">Bed / Bedroom / Max: </span>
                                <span className="font-semibold text-slate-800">
                                  {specDisplay(row.beds)} / {specDisplay(row.bedrooms)} / {specDisplay(row.maxGuests)}
                                </span>
                              </p>
                              <p>
                                <span className="text-slate-500">Unit: </span>
                                <span className="font-semibold text-slate-800">{bookingUnitDisplayLabel(row)}</span>
                              </p>
                            </div>
                          </div>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Check-in</span>
                            <input
                              required
                              type="date"
                              value={infoForm.checkIn}
                              onChange={(e) => setInfoForm((f) => ({ ...f, checkIn: e.target.value }))}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Check-out</span>
                            <input
                              required
                              type="date"
                              value={infoForm.checkOut}
                              min={infoForm.checkIn || undefined}
                              onChange={(e) => setInfoForm((f) => ({ ...f, checkOut: e.target.value }))}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Adults</span>
                            <input
                              required
                              type="number"
                              min={1}
                              value={infoForm.adults}
                              onChange={(e) => setInfoForm((f) => ({ ...f, adults: e.target.value }))}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Children</span>
                            <input
                              required
                              type="number"
                              min={0}
                              value={infoForm.children}
                              onChange={(e) => setInfoForm((f) => ({ ...f, children: e.target.value }))}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Total price</span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={infoForm.totalPrice}
                              onChange={(e) => setInfoForm((f) => ({ ...f, totalPrice: e.target.value }))}
                              placeholder="Leave blank to keep current"
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Source</span>
                            <select
                              value={infoForm.source}
                              onChange={(e) => setInfoForm((f) => ({ ...f, source: e.target.value }))}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                            >
                              {BOOKING_SOURCE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                              {!BOOKING_SOURCE_OPTIONS.some((o) => o.value === infoForm.source) && infoForm.source ? (
                                <option value={infoForm.source}>{sourceLabel(infoForm.source)}</option>
                              ) : null}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1 sm:col-span-2">
                            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Notes</span>
                            <textarea
                              value={infoForm.notes}
                              onChange={(e) => setInfoForm((f) => ({ ...f, notes: e.target.value }))}
                              rows={3}
                              className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </label>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 gap-x-10 gap-y-0 rounded-xl border border-slate-100 bg-slate-50/50 px-4 sm:grid-cols-2">
                          <DetailRow inGrid label="Phone" value={row.guestPhone} />
                          <DetailRow inGrid className="sm:col-span-2" label="Email" value={row.guestEmail} />
                          <DetailRow inGrid label="Accommodation" value={specDisplay(row.accommodationName)} />
                          <DetailRow inGrid label="Type" value={specDisplay(row.unitType)} />
                          <DetailRow inGrid label="Bed" value={specDisplay(row.beds)} />
                          <DetailRow inGrid label="Bedroom" value={specDisplay(row.bedrooms)} />
                          <DetailRow inGrid label="Max guest" value={specDisplay(row.maxGuests)} />
                          <DetailRow inGrid label="Unit" value={bookingUnitDisplayLabel(row)} />
                          <DetailRow inGrid label="Check-in" value={formatYmdToDisplay(row.checkIn)} />
                          <DetailRow inGrid label="Check-out" value={formatYmdToDisplay(row.checkOut)} />
                          <DetailRow
                            inGrid
                            label="Guests"
                            value={
                              <span className="inline-flex items-center gap-2">
                                <span title="Adults">👤{row.adults}</span>
                                <span title="Children">👶{row.children}</span>
                              </span>
                            }
                          />
                          <DetailRow
                            inGrid
                            label="Price"
                            value={formatMoney(bookingBatchPriceTotal(row), row.currency)}
                          />
                          <DetailRow inGrid className="sm:col-span-2" label="Source" value={sourceLabel(row.source)} />
                          {row.notes ? (
                            <DetailRow inGrid className="sm:col-span-2" label="Notes" value={row.notes} />
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {detailTab === 'units' ? (
                    <div
                      id="booking-panel-units"
                      role="tabpanel"
                      aria-labelledby="booking-tab-units"
                      className="space-y-4"
                    >
                      {unitTabLines.length > 0 ? (
                        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 px-5 py-4 shadow-sm">
                          <h3 className="text-xs font-black uppercase tracking-wide text-slate-600">
                            Units in this request
                          </h3>
                          <ul className="mt-2 divide-y divide-slate-200/80">
                            {unitTabLines.map((line) => (
                              <li
                                key={line.id}
                                className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900">
                                    {row.status === 'assigned' ? line.unitName ?? '—' : 'N/A'}
                                  </p>
                                  <p className="font-mono text-[11px] font-semibold text-slate-500">{line.reference}</p>
                                </div>
                                <div className="ml-auto flex items-center gap-3">
                                  <p className="shrink-0 font-bold tabular-nums text-slate-900">
                                    {formatMoney(line.totalPrice, row.currency)}
                                  </p>
                                  {row.status === 'pending' ? (
                                    <button
                                      type="button"
                                      onClick={() => openUnitDeleteConfirm(line)}
                                      disabled={deletingUnitBookingId === Number(line.id) || saving}
                                      className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {deletingUnitBookingId === Number(line.id) ? 'Deleting…' : 'Delete'}
                                    </button>
                                  ) : null}
                                </div>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 border-t border-slate-200/80 pt-2 text-xs text-slate-600">
                            Combined total:{' '}
                            <span className="font-black text-slate-900">
                              {formatMoney(bookingBatchPriceTotal(row), row.currency)}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">No multi-unit breakdown for this booking.</p>
                      )}
                    </div>
                  ) : null}

                  {detailTab === 'payment' ? (
                    <div
                      id="booking-panel-payment"
                      role="tabpanel"
                      aria-labelledby="booking-tab-payment"
                      className="space-y-5"
                    >
                      {paymentsError ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                          {paymentsError}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                          <h3 className="mb-3 border-b border-slate-200 pb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                            Totals
                          </h3>
                          {paymentsLoading && !paymentSummary ? (
                            <p className="text-sm text-slate-500">Loading…</p>
                          ) : (
                            <dl className="space-y-2 text-sm">
                              <div className="flex justify-between gap-4">
                                <dt className="text-slate-600">Subtotal / Grand total</dt>
                                <dd className="font-bold tabular-nums text-slate-900">
                                  {formatMoney(
                                    paymentSummary?.grandTotal ?? bookingBatchPriceTotal(row),
                                    paymentSummary?.currency ?? row.currency,
                                  )}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4">
                                <dt className="text-slate-600">Total paid</dt>
                                <dd className="font-semibold tabular-nums text-emerald-800">
                                  {formatMoney(
                                    paymentSummary?.totalPaid ?? 0,
                                    paymentSummary?.currency ?? row.currency,
                                  )}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4">
                                <dt className="text-slate-600">Total refunded</dt>
                                <dd className="font-semibold tabular-nums text-rose-700">
                                  {formatMoney(
                                    paymentSummary?.totalRefunded ?? 0,
                                    paymentSummary?.currency ?? row.currency,
                                  )}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4">
                                <dt className="text-slate-600">Net paid</dt>
                                <dd className="font-semibold tabular-nums text-slate-900">
                                  {formatMoney(
                                    paymentSummary?.netPaid ?? paymentSummary?.totalPaid ?? 0,
                                    paymentSummary?.currency ?? row.currency,
                                  )}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
                                <dt className="font-bold text-slate-800">Balance due</dt>
                                <dd className="font-black tabular-nums text-[#0f3f73]">
                                  {formatMoney(
                                    paymentSummary?.balanceDue ?? bookingBatchPriceTotal(row),
                                    paymentSummary?.currency ?? row.currency,
                                  )}
                                </dd>
                              </div>
                              {(paymentSummary?.overpaid ?? 0) > 0 ? (
                                <div className="flex justify-between gap-4 text-amber-800">
                                  <dt className="text-sm font-semibold">Overpaid</dt>
                                  <dd className="text-sm font-bold tabular-nums">
                                    {formatMoney(
                                      paymentSummary.overpaid,
                                      paymentSummary?.currency ?? row.currency,
                                    )}
                                  </dd>
                                </div>
                              ) : null}
                              <p className="pt-2 text-xs text-slate-500">
                                Suggested deposit (50%):{' '}
                                <span className="font-semibold text-slate-700">
                                  {formatMoney(
                                    Math.round(Number(bookingBatchPriceTotal(row)) * 100 * 0.5) / 100,
                                    row.currency,
                                  )}
                                </span>
                              </p>
                              <p className="text-xs text-slate-500">
                                Refundable amount:{' '}
                                <span className="font-semibold text-slate-700">
                                  {formatMoney(
                                    paymentSummary?.refundableAmount ?? paymentSummary?.netPaid ?? 0,
                                    paymentSummary?.currency ?? row.currency,
                                  )}
                                </span>
                              </p>
                              <p className="text-xs text-slate-500">Booking source: {sourceLabel(row.source)}</p>
                            </dl>
                          )}
                        </div>

                        <form
                          onSubmit={(ev) => void handleRecordPayment(ev)}
                          className="flex flex-col rounded-xl border border-teal-200/80 bg-gradient-to-b from-teal-50/90 to-white p-4 shadow-sm"
                        >
                          <h3 className="mb-3 rounded-lg bg-teal-600/90 px-3 py-2 text-xs font-black uppercase tracking-wide text-white">
                            Payment information
                          </h3>
                          <label className="mb-3 block">
                            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                              Payment type
                            </span>
                            <select
                              value={paymentForm.paymentType}
                              onChange={(e) =>
                                setPaymentForm((f) => ({ ...f, paymentType: e.target.value }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
                            >
                              {PAYMENT_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="mb-3 block">
                            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                              Amount
                            </span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              required
                              value={paymentForm.amount}
                              onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                              placeholder="0.00"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
                            />
                          </label>
                          <label className="mb-4 block">
                            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                              Notes (optional)
                            </span>
                            <input
                              value={paymentForm.notes}
                              onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                              placeholder="Reference no., branch, etc."
                              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="submit"
                              value="payment"
                              disabled={paymentSaving || row.status === 'cancelled'}
                              className="flex-1 rounded-lg bg-[#1B4F8A] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {paymentSaving ? 'Recording…' : 'Record payment'}
                            </button>
                            <button
                              type="submit"
                              value="refund"
                              disabled={paymentSaving || Number(paymentSummary?.refundableAmount ?? paymentSummary?.netPaid ?? 0) <= 0}
                              className="flex-1 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-800 shadow-sm hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {paymentSaving ? 'Recording…' : 'Record refund'}
                            </button>
                          </div>
                          {row.status === 'cancelled' ? (
                            <p className="mt-2 text-xs text-slate-600">
                              Booking is cancelled; only refunds are allowed when refundable amount is available.
                            </p>
                          ) : null}
                        </form>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <h3 className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-500">
                          Payment history
                        </h3>
                        {paymentsLoading ? (
                          <p className="px-4 py-6 text-center text-sm text-slate-500">Loading…</p>
                        ) : paymentsList.length === 0 ? (
                          <p className="px-4 py-6 text-center text-sm text-slate-600">No payments recorded yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                              <thead>
                                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
                                  <th className="px-4 py-2">Date</th>
                                  <th className="px-4 py-2">Txn</th>
                                  <th className="px-4 py-2">Type</th>
                                  <th className="px-4 py-2 text-right">Amount</th>
                                  <th className="px-4 py-2">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paymentsList.map((p) => (
                                  <tr key={p.id} className="border-b border-slate-50 last:border-0">
                                    <td className="px-4 py-2.5 tabular-nums text-slate-700">
                                      {formatIsoDateTime(p.createdAt)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                          p.transactionKind === 'refund'
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                        }`}
                                      >
                                        {transactionKindLabel(p.transactionKind)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                                      {paymentTypeLabel(p.paymentType)}
                                    </td>
                                    <td
                                      className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                                        p.transactionKind === 'refund' ? 'text-rose-700' : 'text-slate-900'
                                      }`}
                                    >
                                      {p.transactionKind === 'refund' ? '-' : ''}
                                      {formatMoney(p.amount, p.currency ?? row.currency)}
                                    </td>
                                    <td className="max-w-[200px] truncate px-4 py-2.5 text-slate-600" title={p.notes ?? ''}>
                                      {p.notes || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {detailTab === 'history' ? (
                    <div
                      id="booking-panel-history"
                      role="tabpanel"
                      aria-labelledby="booking-tab-history"
                      className="space-y-4"
                    >
                      <ul className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm">
                        <li className="flex flex-col gap-0.5 border-b border-slate-100 pb-3 sm:flex-row sm:justify-between">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Booking created</span>
                          <span className="font-semibold text-slate-900">{formatIsoDateTime(row.createdAt)}</span>
                        </li>
                        <li className="flex flex-col gap-0.5 pt-1 sm:flex-row sm:justify-between">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Last updated</span>
                          <span className="font-semibold text-slate-900">{formatIsoDateTime(row.updatedAt)}</span>
                        </li>
                      </ul>
                      <p className="text-sm text-slate-600">
                        A full activity log (status changes, edits) can be added when audit history is enabled.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:col-span-4">
              {showAvailableUnits ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-3">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Available units</h2>
                    <p className="mt-1 text-xs text-slate-500">Same property, type, beds, bedrooms, and max guests — free for these dates.</p>
                  </div>
                  <div className="px-5 py-3">
                    {availableUnitsLoading ? (
                      <p className="text-sm text-slate-500">Loading matching units…</p>
                    ) : availableUnits.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {availableUnits.map((u) => (
                          <li key={u.id} className="py-2 text-sm font-semibold text-slate-800">
                            <span>{u.name}</span>
                            {u.propertyName ? (
                              <span className="ml-2 block font-normal text-slate-500 sm:inline sm:ml-2">({u.propertyName})</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-600">No matching units are free for these dates.</p>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-3">
                  <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Update status</h2>
                </div>
                <div className="flex flex-col gap-2 px-5 py-3">
                  {row.status === 'pending' ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSetStatus('accepted')}
                      className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-900 shadow-sm hover:bg-emerald-100 disabled:opacity-60"
                    >
                      Accept
                    </button>
                  ) : null}
                  {row.status === 'accepted' ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSetStatus('assigned')}
                      className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-900 shadow-sm hover:bg-emerald-100 disabled:opacity-60"
                    >
                      Mark as assigned
                    </button>
                  ) : null}
                  {row.status === 'assigned' ? (
                    <p className="text-sm font-medium text-slate-600">This reservation is assigned.</p>
                  ) : null}
                  {row.status !== 'cancelled' ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSetStatus('cancelled')}
                      className="w-full rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-900 shadow-sm hover:bg-rose-100 disabled:opacity-60"
                    >
                      Cancel booking
                    </button>
                  ) : (
                    <p className="text-sm font-medium text-rose-700">This reservation is cancelled.</p>
                  )}
                  {saving ? <p className="text-xs text-slate-500">Saving…</p> : null}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/bookings')}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {unitDeleteConfirm ? (
          <div
            className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unit-delete-title"
            onMouseDown={(ev) => {
              if (ev.target === ev.currentTarget) {
                closeUnitDeleteConfirm()
              }
            }}
          >
            <div className="max-h-[min(88vh,420px)] w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 id="unit-delete-title" className="text-lg font-black text-[#0f3f73]">
                  Delete booking request?
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  This permanently removes one unit request ({unitDeleteConfirm.reference || `#${unitDeleteConfirm.id}`}). This cannot be undone.
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeUnitDeleteConfirm}
                  disabled={deletingUnitBookingId != null}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDeleteUnitRequest()}
                  disabled={deletingUnitBookingId != null}
                  className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 sm:w-auto"
                >
                  {deletingUnitBookingId != null ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default BookingDetailPage
