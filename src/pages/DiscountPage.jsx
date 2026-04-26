import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../utils/api'

const PROMO_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount (EUR)' },
]

const UNIT_TYPES = [
  { value: 'early_bird', label: 'Early Bird' },
  { value: 'long_stay', label: 'Long Stay' },
  { value: 'last_minute', label: 'Last Minute' },
  { value: 'weekend_discount', label: 'Weekend Discount' },
  { value: 'date_range', label: 'Date Range' },
]

function discountTypeLabel(type) {
  return UNIT_TYPES.find((item) => item.value === type)?.label ?? type
}

function promoValueLabel(row) {
  return row.discountType === 'percentage' ? `${Number(row.discountValue)}% off` : `EUR ${Number(row.discountValue)} off`
}

function PromoCodeModal({ open, saving, error, initial, onClose, onSubmit }) {
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minNights: '1',
    maxUses: '',
  })

  useEffect(() => {
    if (!open) return
    setForm({
      code: initial?.code ?? '',
      discountType: initial?.discountType ?? 'percentage',
      discountValue: initial?.discountValue != null ? String(initial.discountValue) : '',
      minNights: initial?.minNights != null ? String(initial.minNights) : '1',
      maxUses: initial?.maxUses != null ? String(initial.maxUses) : '',
    })
  }, [open, initial])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({
            code: form.code.trim().toUpperCase(),
            discountType: form.discountType,
            discountValue: Number(form.discountValue),
            minNights: Number(form.minNights),
            maxUses: form.maxUses.trim() === '' ? null : Number(form.maxUses),
          })
        }}
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-3xl font-black text-[#0f3f73]">{initial ? 'Edit Promo Code' : 'New Promo Code'}</h2>
          <button type="button" onClick={onClose} className="text-xl font-bold text-slate-500">
            ×
          </button>
        </div>
        {error ? <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">Code</span>
            <input
              required
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="E.G. SUMMER20"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Discount Type</span>
              <select
                value={form.discountType}
                onChange={(event) => setForm((prev) => ({ ...prev, discountType: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                {PROMO_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">{form.discountType === 'percentage' ? 'Value (%)' : 'Value (EUR)'}</span>
              <input
                required
                type="number"
                min={0.01}
                step="0.01"
                value={form.discountValue}
                onChange={(event) => setForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 50'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Min. Nights</span>
              <input
                required
                type="number"
                min={1}
                value={form.minNights}
                onChange={(event) => setForm((prev) => ({ ...prev, minNights: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Max Uses (blank = unlimited)</span>
              <input
                value={form.maxUses}
                onChange={(event) => setForm((prev) => ({ ...prev, maxUses: event.target.value }))}
                placeholder="Unlimited"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#2B5AED] px-4 py-2 font-semibold text-white disabled:opacity-60">
            {saving ? 'Saving...' : initial ? 'Update Code' : 'Create Code'}
          </button>
        </div>
      </form>
    </div>
  )
}

function UnitDiscountModal({ open, saving, error, units, initial, onClose, onSubmit }) {
  const [form, setForm] = useState({
    unitId: '',
    discountType: 'early_bird',
    discountPercent: '',
    minDaysInAdvance: '',
  })

  useEffect(() => {
    if (!open) return
    setForm({
      unitId: initial?.unitId != null ? String(initial.unitId) : units[0]?.id ? String(units[0].id) : '',
      discountType: initial?.discountType ?? 'early_bird',
      discountPercent: initial?.discountPercent != null ? String(initial.discountPercent) : '',
      minDaysInAdvance: initial?.minDaysInAdvance != null ? String(initial.minDaysInAdvance) : '',
    })
  }, [open, initial, units])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({
            unitId: Number(form.unitId),
            discountType: form.discountType,
            discountPercent: Number(form.discountPercent),
            minDaysInAdvance: form.minDaysInAdvance.trim() === '' ? null : Number(form.minDaysInAdvance),
          })
        }}
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-3xl font-black text-[#0f3f73]">{initial ? 'Edit Unit Discount' : 'New Unit Discount'}</h2>
          <button type="button" onClick={onClose} className="text-xl font-bold text-slate-500">
            ×
          </button>
        </div>
        {error ? <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">Unit</span>
            <select
              required
              value={form.unitId}
              onChange={(event) => setForm((prev) => ({ ...prev, unitId: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Discount Type</span>
              <select
                value={form.discountType}
                onChange={(event) => setForm((prev) => ({ ...prev, discountType: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                {UNIT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Discount (%)</span>
              <input
                required
                type="number"
                min={0.01}
                max={100}
                step="0.01"
                value={form.discountPercent}
                onChange={(event) => setForm((prev) => ({ ...prev, discountPercent: event.target.value }))}
                placeholder="e.g. 15"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">Min. Days in Advance</span>
            <input
              value={form.minDaysInAdvance}
              onChange={(event) => setForm((prev) => ({ ...prev, minDaysInAdvance: event.target.value }))}
              placeholder="e.g. 30"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#2B5AED] px-4 py-2 font-semibold text-white disabled:opacity-60">
            {saving ? 'Saving...' : initial ? 'Update Discount' : 'Create Discount'}
          </button>
        </div>
      </form>
    </div>
  )
}

function DiscountPage() {
  const [activeTab, setActiveTab] = useState('promo')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [promoCodes, setPromoCodes] = useState([])
  const [unitDiscounts, setUnitDiscounts] = useState([])
  const [units, setUnits] = useState([])

  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [unitModalOpen, setUnitModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [editingUnitDiscount, setEditingUnitDiscount] = useState(null)
  const [modalError, setModalError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setError(null)
    const [promoRes, unitRes, unitsRes] = await Promise.all([
      apiFetch('/v1/discounts/promo-codes'),
      apiFetch('/v1/discounts/unit-discounts'),
      apiFetch('/v1/configuration/units'),
    ])
    setPromoCodes(Array.isArray(promoRes?.promoCodes) ? promoRes.promoCodes : [])
    setUnitDiscounts(Array.isArray(unitRes?.unitDiscounts) ? unitRes.unitDiscounts : [])
    setUnits(Array.isArray(unitsRes?.units) ? unitsRes.units : [])
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadData()
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load discounts.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const promoStats = useMemo(() => {
    const active = promoCodes.filter((item) => item.status === 'active').length
    const totalUses = promoCodes.reduce((sum, item) => sum + (Number(item.usesCount) || 0), 0)
    const avgDiscount =
      promoCodes.length > 0
        ? promoCodes.reduce((sum, item) => sum + (Number(item.discountType === 'fixed' ? 0 : item.discountValue) || 0), 0) / promoCodes.length
        : 0
    return { active, totalUses, avgDiscount }
  }, [promoCodes])

  async function handlePromoSave(payload) {
    setSaving(true)
    setModalError(null)
    try {
      if (editingPromo) {
        await apiFetch(`/v1/discounts/promo-codes/${editingPromo.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/v1/discounts/promo-codes', { method: 'POST', body: JSON.stringify(payload) })
      }
      setPromoModalOpen(false)
      setEditingPromo(null)
      await loadData()
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Failed to save promo code.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUnitSave(payload) {
    setSaving(true)
    setModalError(null)
    try {
      if (editingUnitDiscount) {
        await apiFetch(`/v1/discounts/unit-discounts/${editingUnitDiscount.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/v1/discounts/unit-discounts', { method: 'POST', body: JSON.stringify(payload) })
      }
      setUnitModalOpen(false)
      setEditingUnitDiscount(null)
      await loadData()
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Failed to save unit discount.')
    } finally {
      setSaving(false)
    }
  }

  async function deletePromo(id) {
    if (!window.confirm('Delete this promo code?')) return
    await apiFetch(`/v1/discounts/promo-codes/${id}`, { method: 'DELETE' })
    await loadData()
  }

  async function deleteUnitDiscount(id) {
    if (!window.confirm('Delete this unit discount?')) return
    await apiFetch(`/v1/discounts/unit-discounts/${id}`, { method: 'DELETE' })
    await loadData()
  }

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f3f73]">Discounts</h1>
          <p className="text-sm text-slate-500">Manage promo codes and per-unit automatic discounts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('promo')}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${activeTab === 'promo' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
          >
            Promo Codes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unit')}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${activeTab === 'unit' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
          >
            Per Unit
          </button>
        </div>

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}

        {activeTab === 'promo' ? (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingPromo(null)
                  setModalError(null)
                  setPromoModalOpen(true)
                }}
                className="rounded-lg bg-[#2B5AED] px-4 py-2 text-sm font-semibold text-white"
              >
                + New Code
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Active Codes</p><p className="text-2xl font-black">{promoStats.active}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Total Uses</p><p className="text-2xl font-black">{promoStats.totalUses}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Avg. Discount</p><p className="text-2xl font-black">{Math.round(promoStats.avgDiscount)}%</p></div>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Min Nights</th><th className="px-4 py-3">Uses</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="px-4 py-8 text-slate-500" colSpan={6}>Loading...</td></tr>
                    ) : promoCodes.length === 0 ? (
                      <tr><td className="px-4 py-8 text-slate-500" colSpan={6}>No promo codes yet.</td></tr>
                    ) : promoCodes.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-bold">{row.code}</td>
                        <td className="px-4 py-3 text-emerald-700 font-semibold">{promoValueLabel(row)}</td>
                        <td className="px-4 py-3">{row.minNights} night{row.minNights > 1 ? 's' : ''}</td>
                        <td className="px-4 py-3">{row.usesCount} / {row.maxUses ?? 'Unlimited'}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${row.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{row.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => { setEditingPromo(row); setPromoModalOpen(true); setModalError(null) }} className="text-slate-700">✎</button>
                            <button type="button" onClick={() => deletePromo(row.id).catch((e) => setError(e instanceof Error ? e.message : 'Delete failed.'))} className="text-rose-600">🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingUnitDiscount(null)
                  setModalError(null)
                  setUnitModalOpen(true)
                }}
                disabled={!units.length}
                className="rounded-lg bg-[#2B5AED] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                + New Discount
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="px-4 py-3">Unit</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Condition</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="px-4 py-8 text-slate-500" colSpan={6}>Loading...</td></tr>
                    ) : unitDiscounts.length === 0 ? (
                      <tr><td className="px-4 py-8 text-slate-500" colSpan={6}>No unit discounts yet.</td></tr>
                    ) : unitDiscounts.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold">{row.unitName}</td>
                        <td className="px-4 py-3">{discountTypeLabel(row.discountType)}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">{Number(row.discountPercent)}% off</td>
                        <td className="px-4 py-3">{row.minDaysInAdvance ? `${row.minDaysInAdvance}+ days ahead` : 'Always eligible'}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${row.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{row.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => { setEditingUnitDiscount(row); setUnitModalOpen(true); setModalError(null) }} className="text-slate-700">✎</button>
                            <button type="button" onClick={() => deleteUnitDiscount(row.id).catch((e) => setError(e instanceof Error ? e.message : 'Delete failed.'))} className="text-rose-600">🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <PromoCodeModal
        open={promoModalOpen}
        saving={saving}
        error={modalError}
        initial={editingPromo}
        onClose={() => setPromoModalOpen(false)}
        onSubmit={handlePromoSave}
      />
      <UnitDiscountModal
        open={unitModalOpen}
        saving={saving}
        error={modalError}
        units={units}
        initial={editingUnitDiscount}
        onClose={() => setUnitModalOpen(false)}
        onSubmit={handleUnitSave}
      />
    </div>
  )
}

export default DiscountPage
