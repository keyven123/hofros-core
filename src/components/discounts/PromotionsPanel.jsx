import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../utils/api'

const FIELD = 'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none ring-[#2B5AED]/30 focus:ring-2'
const STATUS_CLASS = {
  active: 'bg-emerald-100 text-emerald-700',
  scheduled: 'bg-sky-100 text-sky-800',
  expired: 'bg-amber-100 text-amber-800',
  disabled: 'bg-slate-200 text-slate-600',
}

const FALLBACK_TYPES = [
  { id: 'early_bird', name: 'Early Bird Promotion', description: 'Book in advance and save more.', hasDuration: true, hasEligibilityDays: true, eligibilityLabel: 'Minimum advance booking (days before check-in)', fixedDiscountScope: 'booking', defaultMinimumNights: null },
  { id: 'last_minute', name: 'Last Minute Promotion', description: 'Exclusive discounts for last-minute bookings.', hasDuration: true, hasEligibilityDays: true, eligibilityLabel: 'Maximum advance booking (days before check-in)', fixedDiscountScope: 'booking', defaultMinimumNights: null },
  { id: 'weekly_rate', name: 'Weekly Rate', description: 'Special rates for stays of 7 nights or more.', hasDuration: false, hasEligibilityDays: false, eligibilityLabel: null, fixedDiscountScope: 'night', defaultMinimumNights: 7 },
  { id: 'monthly_rate', name: 'Monthly Rate', description: 'Special rates for stays of 30 nights or more.', hasDuration: false, hasEligibilityDays: false, eligibilityLabel: null, fixedDiscountScope: 'night', defaultMinimumNights: 30 },
  { id: 'mobile_app', name: 'Hofros Mobile App Discount', description: 'Exclusive mobile app booking discounts.', hasDuration: true, hasEligibilityDays: false, eligibilityLabel: null, fixedDiscountScope: 'booking', defaultMinimumNights: null },
]

function emptyForm(typeMeta, row = null) {
  const meta = typeMeta || FALLBACK_TYPES[0]
  return {
    name: row?.name ?? '',
    promotionType: row?.promotionType ?? meta.id,
    isEnabled: Boolean(row?.isEnabled),
    startDate: row?.startDate ?? '',
    endDate: row?.endDate ?? '',
    noEndDate: row ? Boolean(row.noEndDate) : false,
    eligibilityDays: row?.eligibilityDays != null ? String(row.eligibilityDays) : (meta.hasEligibilityDays ? '30' : ''),
    discountType: row?.discountType ?? 'percentage',
    discountValue: row?.discountValue != null && Number(row.discountValue) > 0 ? String(row.discountValue) : '',
  }
}

function PromotionFormModal({ open, mode, types, row, saving, error, onClose, onSubmit }) {
  const typeOptions = types?.length ? types : FALLBACK_TYPES
  const [form, setForm] = useState(() => emptyForm(typeOptions[0], row))

  useEffect(() => {
    if (!open) return
    const initialType = typeOptions.find((item) => item.id === (row?.promotionType || typeOptions[0].id)) || typeOptions[0]
    setForm(emptyForm(initialType, mode === 'edit' ? row : null))
  }, [open, row, mode])

  const selectedType = useMemo(
    () => typeOptions.find((item) => item.id === form.promotionType) || typeOptions[0],
    [form.promotionType, typeOptions],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f3f73]/35 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0f3f73]">{mode === 'edit' ? 'Update promotion' : 'Create promotion'}</h2>
            <p className="mt-1 text-sm text-slate-500">{selectedType?.description}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>

        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit({
              name: form.name.trim(),
              promotionType: form.promotionType,
              isEnabled: form.isEnabled,
              startDate: form.startDate || null,
              endDate: form.noEndDate ? null : form.endDate || null,
              noEndDate: form.noEndDate,
              eligibilityDays: form.eligibilityDays !== '' ? Number(form.eligibilityDays) : null,
              discountType: form.discountType,
              discountValue: Number(form.discountValue),
            })
          }}
        >
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Promotion name
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className={FIELD}
              placeholder="e.g. Early Bird, Last Minute, Summer Deal"
            />
          </label>

          {mode === 'create' ? (
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Offer rules
              <select
                value={form.promotionType}
                onChange={(event) => {
                  const next = typeOptions.find((item) => item.id === event.target.value) || typeOptions[0]
                  setForm((current) => ({
                    ...emptyForm(next),
                    name: current.name,
                  }))
                }}
                className={FIELD}
              >
                {typeOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-slate-400">
                Chooses how eligibility is calculated. The names above are examples only.
              </span>
            </label>
          ) : null}

          {selectedType?.hasDuration ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start date
                  <input
                    type="date"
                    required={form.isEnabled}
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                    className={FIELD}
                  />
                </label>
                <label className={`text-xs font-semibold uppercase tracking-wide text-slate-500 ${form.noEndDate ? 'opacity-50' : ''}`}>
                  End date
                  <input
                    type="date"
                    disabled={form.noEndDate}
                    required={form.isEnabled && !form.noEndDate}
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                    className={FIELD}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.noEndDate}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    noEndDate: event.target.checked,
                    endDate: event.target.checked ? '' : current.endDate,
                  }))}
                />
                No end date
              </label>
            </>
          ) : null}

          {selectedType?.hasEligibilityDays ? (
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {selectedType.eligibilityLabel || 'Eligibility days'}
              <input
                type="number"
                min="1"
                required
                value={form.eligibilityDays}
                onChange={(event) => setForm((current) => ({ ...current, eligibilityDays: event.target.value }))}
                className={FIELD}
              />
            </label>
          ) : null}

          {selectedType?.defaultMinimumNights ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Minimum stay enforced at <span className="font-bold text-[#0f3f73]">{selectedType.defaultMinimumNights} consecutive nights</span>.
            </div>
          ) : null}

          {form.promotionType === 'mobile_app' ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-900">
              Applies only to bookings from the official Hofros mobile app (validated server-side).
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Discount type
              <select
                value={form.discountType}
                onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value }))}
                className={FIELD}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed amount (₱)</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Discount value
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={form.discountType === 'percentage' ? '100' : undefined}
                required
                value={form.discountValue}
                onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))}
                className={FIELD}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(event) => setForm((current) => ({ ...current, isEnabled: event.target.checked }))}
            />
            Enable this promotion
          </label>

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="h-10 rounded-lg bg-[#2B5AED] px-4 text-xs font-bold text-white disabled:opacity-50">
              {saving ? 'Saving…' : mode === 'edit' ? 'Update promotion' : 'Create promotion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PromotionsPanel({ onError }) {
  const [rows, setRows] = useState([])
  const [types, setTypes] = useState(FALLBACK_TYPES)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', row: null })

  async function load() {
    const data = await apiFetch('/v1/discounts/promotions')
    setRows(Array.isArray(data?.promotions) ? data.promotions : [])
    setTypes(Array.isArray(data?.promotionTypes) && data.promotionTypes.length ? data.promotionTypes : FALLBACK_TYPES)
    setStats(data?.stats ?? null)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await load()
      } catch (e) {
        if (!cancelled) onError?.(e instanceof Error ? e.message : 'Failed to load promotions.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [onError])

  function openCreate() {
    setModalError(null)
    setNotice('')
    setModal({ open: true, mode: 'create', row: null })
  }

  function openEdit(row) {
    setModalError(null)
    setNotice('')
    setModal({ open: true, mode: 'edit', row })
  }

  async function save(payload) {
    setSaving(true)
    setModalError(null)
    try {
      if (modal.mode === 'edit' && modal.row?.id) {
        const { promotionType: _promotionType, ...updatePayload } = payload
        const data = await apiFetch(`/v1/discounts/promotions/${modal.row.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        })
        setNotice(data?.message || 'Promotion updated.')
      } else {
        const data = await apiFetch('/v1/discounts/promotions', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setNotice(data?.message || 'Promotion created.')
      }
      setModal({ open: false, mode: 'create', row: null })
      await load()
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Failed to save promotion.')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(row) {
    if (!row.isEnabled && (!row.discountValue || Number(row.discountValue) <= 0)) {
      openEdit(row)
      return
    }
    if (!window.confirm(`${row.isEnabled ? 'Disable' : 'Enable'} “${row.name}”?`)) return
    try {
      const data = await apiFetch(`/v1/discounts/promotions/${row.id}/toggle`, { method: 'POST', body: '{}' })
      setNotice(data?.message || 'Promotion updated.')
      await load()
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Could not update promotion.')
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete “${row.name}”? This cannot be undone.`)) return
    try {
      await apiFetch(`/v1/discounts/promotions/${row.id}`, { method: 'DELETE' })
      setNotice('Promotion deleted.')
      await load()
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Could not delete promotion.')
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button type="button" onClick={openCreate} className="rounded-lg bg-[#2B5AED] px-4 py-2 text-sm font-semibold text-white">
          + Create promotion
        </button>
      </div>

      {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Active promotions</p>
          <p className="text-2xl font-black text-[#0f3f73]">{loading ? '—' : stats?.activePromotions ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Bookings with promotion</p>
          <p className="text-2xl font-black text-[#0f3f73]">{loading ? '—' : stats?.bookingsWithPromotion ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total discount given</p>
          <p className="text-2xl font-black text-[#0f3f73]">{loading ? '—' : `₱${Number(stats?.totalDiscountGiven ?? 0).toLocaleString()}`}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">Loading promotions…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
          <p className="text-sm font-semibold text-[#0f3f73]">No promotions yet</p>
          <p className="mt-1 text-sm text-slate-500">Create Early Bird, Last Minute, Weekly, Monthly, or Mobile App offers.</p>
          <button type="button" onClick={openCreate} className="mt-4 rounded-lg bg-[#2B5AED] px-4 py-2 text-sm font-semibold text-white">
            Create promotion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[#0f3f73]">{row.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_CLASS[row.status] || STATUS_CLASS.disabled}`}>
                      {row.statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{row.description}</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                  <span>{row.isEnabled ? 'On' : 'Off'}</span>
                  <input type="checkbox" checked={Boolean(row.isEnabled)} onChange={() => toggle(row)} className="h-4 w-4 accent-[#2B5AED]" />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Discount</p>
                  <p className="font-semibold text-emerald-700">{row.discountSummary}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Duration</p>
                  <p className="font-semibold text-slate-700">{row.durationSummary || (row.minimumNights ? `${row.minimumNights}+ nights` : 'Always available when enabled')}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => openEdit(row)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0f3f73] hover:bg-slate-50">
                  Update
                </button>
                <button type="button" onClick={() => remove(row)} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <PromotionFormModal
        open={modal.open}
        mode={modal.mode}
        types={types}
        row={modal.row}
        saving={saving}
        error={modalError}
        onClose={() => setModal({ open: false, mode: 'create', row: null })}
        onSubmit={save}
      />
    </>
  )
}
