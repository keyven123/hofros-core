import { useEffect, useMemo, useState } from 'react'
import { AdminHeading, AdminPanel, AdminSearch, Avatar, TableCell, TableHead, formatMoney, matchesQuery } from '../../components/admin/adminUi'
import { adminFetch } from '../../utils/adminApi'

const EMPTY_BASELINE = {
  pricePerRoom: '',
  maxRooms: '',
}

function maximumLabel(maxRooms) {
  return maxRooms == null ? 'No room cap' : `${maxRooms} ${maxRooms === 1 ? 'room' : 'rooms'}`
}

function highestCharge(plan) {
  if (plan.maxRooms == null) return 'No cap'
  return formatMoney(Number(plan.pricePerRoom) * Number(plan.maxRooms), plan.currency)
}

const fieldClass = 'h-9 w-full rounded-lg border border-[#e8e4dc] px-2 outline-none ring-[#c6a15b] focus:ring-2'

function AdminSubscriptionsPage() {
  const [features, setFeatures] = useState([])
  const [plans, setPlans] = useState([])
  const [merchants, setMerchants] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [savingPlan, setSavingPlan] = useState(false)
  const [savingFeature, setSavingFeature] = useState(false)
  const [planForm, setPlanForm] = useState(EMPTY_BASELINE)
  const [editingFeatureKey, setEditingFeatureKey] = useState(null)
  const [featurePrice, setFeaturePrice] = useState('')

  function applyPayload(data) {
    setFeatures(data.features ?? [])
    setPlans(data.plans ?? [])
    setMerchants(data.merchants ?? [])
  }

  useEffect(() => {
    let cancelled = false
    adminFetch('/v1/admin/subscriptions')
      .then((data) => {
        if (!cancelled) applyPayload(data)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load subscriptions.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const baselines = useMemo(
    () => [...plans].sort((left, right) => {
      if (left.maxRooms == null) return 1
      if (right.maxRooms == null) return -1
      return left.maxRooms - right.maxRooms
    }),
    [plans],
  )

  const visible = useMemo(
    () => merchants.filter((row) => matchesQuery(query, [row.name, row.email, row.plan?.name, maximumLabel(row.plan?.maxRooms)])),
    [merchants, query],
  )

  function closePlanForm() {
    setCreating(false)
    setEditingId(null)
    setPlanForm(EMPTY_BASELINE)
  }

  function startCreate() {
    setEditingId(null)
    setEditingFeatureKey(null)
    setPlanForm(EMPTY_BASELINE)
    setCreating(true)
    setError('')
  }

  function startEdit(plan) {
    setCreating(false)
    setEditingFeatureKey(null)
    setEditingId(plan.id)
    setPlanForm({
      pricePerRoom: String(plan.pricePerRoom ?? ''),
      maxRooms: plan.maxRooms == null ? '' : String(plan.maxRooms),
    })
    setError('')
  }

  async function savePlan(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSavingPlan(true)
    const maxRooms = planForm.maxRooms === '' ? null : Number(planForm.maxRooms)
    try {
      const data = await adminFetch(
        editingId ? `/v1/admin/subscriptions/plans/${editingId}` : '/v1/admin/subscriptions/plans',
        {
          method: editingId ? 'PUT' : 'POST',
          body: JSON.stringify({
            price_per_room: Number(planForm.pricePerRoom),
            max_rooms: maxRooms,
          }),
        },
      )
      applyPayload(data)
      closePlanForm()
      setNotice(editingId ? 'Baseline amount was updated.' : 'Room baseline is ready.')
    } catch (requestError) {
      setError(requestError?.message || 'Could not save the baseline.')
    } finally {
      setSavingPlan(false)
    }
  }

  function startFeatureEdit(feature) {
    closePlanForm()
    setEditingFeatureKey(feature.key)
    setFeaturePrice(String(feature.monthlyPrice ?? 0))
    setError('')
  }

  function closeFeatureEdit() {
    setEditingFeatureKey(null)
    setFeaturePrice('')
  }

  async function saveFeature(event) {
    event.preventDefault()
    if (!editingFeatureKey) return
    setError('')
    setNotice('')
    setSavingFeature(true)
    const saved = features.find((feature) => feature.key === editingFeatureKey)
    try {
      const data = await adminFetch('/v1/admin/subscriptions/features', {
        method: 'PUT',
        body: JSON.stringify({
          features: [{ key: editingFeatureKey, monthly_price: Number(featurePrice) }],
        }),
      })
      applyPayload(data)
      closeFeatureEdit()
      setNotice(`${saved?.name || 'Module'} price was updated.`)
    } catch (requestError) {
      setError(requestError?.message || 'Could not save the module price.')
    } finally {
      setSavingFeature(false)
    }
  }

  function baselineFields() {
    return (
      <>
        <TableCell>
          <input
            type="number"
            min="1"
            placeholder="No cap"
            aria-label="Maximum rooms"
            value={planForm.maxRooms}
            onChange={(event) => setPlanForm((current) => ({ ...current, maxRooms: event.target.value }))}
            className={fieldClass}
          />
        </TableCell>
        <TableCell>
          <input
            required
            type="number"
            min="0"
            step="1"
            aria-label="Amount per room"
            value={planForm.pricePerRoom}
            onChange={(event) => setPlanForm((current) => ({ ...current, pricePerRoom: event.target.value }))}
            className={fieldClass}
          />
        </TableCell>
        <TableCell className="text-slate-400">—</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <button type="submit" disabled={savingPlan} className="h-9 rounded-full bg-[#0b1020] px-3 text-xs font-semibold text-[#e8c872] disabled:opacity-50">
              {savingPlan ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={closePlanForm} className="h-9 rounded-full px-3 text-xs font-semibold text-slate-600 ring-1 ring-[#e8e4dc]">
              Cancel
            </button>
          </div>
        </TableCell>
      </>
    )
  }

  return (
    <>
      <AdminHeading
        kicker="Overview"
        title="Subscriptions"
        description="A merchant pays the amount per room for the baseline that covers how many rooms they have, plus the price of each module they turn on."
      >
        <AdminSearch value={query} onChange={setQuery} placeholder="Search merchants" />
      </AdminHeading>

      {error ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}
      {notice ? <p className="mb-4 text-sm font-medium text-emerald-700">{notice}</p> : null}

      <AdminPanel className="mb-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#f1ece4] px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0b1020]">Room baselines</h2>
            <p className="text-xs text-slate-500">Maximum rooms, the amount per room, and the highest monthly charge.</p>
          </div>
          <button
            type="button"
            onClick={creating ? closePlanForm : startCreate}
            className="h-9 rounded-full bg-[#0b1020] px-4 text-xs font-semibold text-[#e8c872]"
          >
            {creating ? 'Close' : 'Add baseline'}
          </button>
        </div>
        <form onSubmit={savePlan}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[#f1ece4]">
              <tr>
                <TableHead>Maximum rooms</TableHead>
                <TableHead>Amount per room</TableHead>
                <TableHead>Highest charge</TableHead>
                <TableHead />
              </tr>
            </thead>
            <tbody>
              {creating ? (
                <tr className="border-b border-[#f6f3ee] bg-[#fbfaf6]">
                  {baselineFields()}
                </tr>
              ) : null}
              {baselines.map((plan) => (
                <tr key={plan.id} className="border-b border-[#f6f3ee] last:border-0 hover:bg-[#fbfaf6]">
                  {editingId === plan.id ? baselineFields() : (
                    <>
                      <TableCell className="font-semibold text-[#0b1020]">{maximumLabel(plan.maxRooms)}</TableCell>
                      <TableCell>{formatMoney(plan.pricePerRoom, plan.currency)}</TableCell>
                      <TableCell>{highestCharge(plan)}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => startEdit(plan)}
                          className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b1020] ring-1 ring-[#e8e4dc] hover:bg-[#f8f1de]"
                        >
                          Edit
                        </button>
                      </TableCell>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </form>
        {!loading && baselines.length === 0 && !creating ? <p className="px-4 py-8 text-sm text-slate-500">No room baselines yet.</p> : null}
      </AdminPanel>

      <AdminPanel className="mb-4">
        <div className="border-b border-[#f1ece4] px-4 py-3">
          <h2 className="text-sm font-semibold text-[#0b1020]">Module prices</h2>
          <p className="text-xs text-slate-500">Charged when a merchant turns the module on. Removed from future invoices when they turn it off.</p>
        </div>
        <form onSubmit={saveFeature}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[#f1ece4]">
              <tr>
                <TableHead>Module</TableHead>
                <TableHead>What it covers</TableHead>
                <TableHead>Price / month</TableHead>
                <TableHead />
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.key} className="border-b border-[#f6f3ee] last:border-0 hover:bg-[#fbfaf6]">
                  {editingFeatureKey === feature.key ? (
                    <>
                      <TableCell className="font-semibold text-[#0b1020]">{feature.name}</TableCell>
                      <TableCell className="text-slate-500">{feature.description}</TableCell>
                      <TableCell>
                        <input
                          required
                          type="number"
                          min="0"
                          step="1"
                          aria-label={`${feature.name} price`}
                          value={featurePrice}
                          onChange={(event) => setFeaturePrice(event.target.value)}
                          className="h-9 w-28 rounded-lg border border-[#e8e4dc] px-2 outline-none ring-[#c6a15b] focus:ring-2"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <button type="submit" disabled={savingFeature} className="h-9 rounded-full bg-[#0b1020] px-3 text-xs font-semibold text-[#e8c872] disabled:opacity-50">
                            {savingFeature ? 'Saving…' : 'Save'}
                          </button>
                          <button type="button" onClick={closeFeatureEdit} className="h-9 rounded-full px-3 text-xs font-semibold text-slate-600 ring-1 ring-[#e8e4dc]">
                            Cancel
                          </button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-semibold text-[#0b1020]">{feature.name}</TableCell>
                      <TableCell className="text-slate-500">{feature.description}</TableCell>
                      <TableCell>{formatMoney(feature.monthlyPrice, feature.currency)}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => startFeatureEdit(feature)}
                          className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b1020] ring-1 ring-[#e8e4dc] hover:bg-[#f8f1de]"
                        >
                          Edit
                        </button>
                      </TableCell>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </form>
      </AdminPanel>

      <AdminPanel>
        <div className="border-b border-[#f1ece4] px-4 py-3">
          <h2 className="text-sm font-semibold text-[#0b1020]">Merchants</h2>
          <p className="text-xs text-slate-500">Active rooms pick the baseline. Monthly adds the modules that merchant has turned on.</p>
        </div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[#f1ece4]">
            <tr>
              <TableHead>Merchant</TableHead>
              <TableHead>Rooms</TableHead>
              <TableHead>Maximum</TableHead>
              <TableHead>Per room</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Monthly</TableHead>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-[#f6f3ee] last:border-0 hover:bg-[#fbfaf6]">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} />
                    <div>
                      <p className="font-semibold text-[#0b1020]">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums font-semibold text-[#0b1020]">{row.rooms}</TableCell>
                <TableCell>{row.plan ? maximumLabel(row.plan.maxRooms) : '—'}</TableCell>
                <TableCell>{row.plan ? formatMoney(row.plan.pricePerRoom, row.plan.currency) : '—'}</TableCell>
                <TableCell className="tabular-nums">{row.activeModules ?? 0}</TableCell>
                <TableCell className="font-semibold text-[#0b1020]">{row.plan ? formatMoney(row.plan.monthly, row.plan.currency) : '—'}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && visible.length === 0 ? <p className="px-4 py-8 text-sm text-slate-500">No merchants match this search.</p> : null}
        {loading ? <p className="px-4 py-8 text-sm text-slate-500">Loading subscriptions…</p> : null}
      </AdminPanel>
    </>
  )
}

export default AdminSubscriptionsPage
