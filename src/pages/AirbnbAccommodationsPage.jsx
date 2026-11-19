import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../utils/api'

function AirbnbAccommodationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedFromUrl = searchParams.get('userId') || ''

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [data, setData] = useState(null)
  const [mappings, setMappings] = useState({})
  const [newUserId, setNewUserId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(selectedFromUrl)

  const applyPayload = useCallback((payload) => {
    setData(payload)
    setSelectedUserId(payload?.userId || '')
    setMappings(payload?.mappings && typeof payload.mappings === 'object' ? { ...payload.mappings } : {})
    if (payload?.userId) {
      setSearchParams({ userId: payload.userId }, { replace: true })
    }
  }, [setSearchParams])

  const load = useCallback(async (userId) => {
    setLoading(true)
    setError('')
    try {
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : ''
      const payload = await apiFetch(`/v1/booking-portals/airbnb/accommodations${query}`)
      applyPayload(payload)
    } catch (requestError) {
      setError(requestError?.message || 'Could not load Airbnb accommodations.')
      if (String(requestError?.message || '').toLowerCase().includes('connect')) {
        setTimeout(() => navigate('/airbnb-connect'), 800)
      }
    } finally {
      setLoading(false)
    }
  }, [applyPayload, navigate])

  useEffect(() => {
    void load(selectedFromUrl || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hosts = useMemo(() => data?.hosts || [], [data])
  const listingOptions = useMemo(() => data?.listings || [], [data])
  const units = data?.units || []

  async function selectHost(userId) {
    if (!userId || userId === selectedUserId) return
    setBusy(`select-${userId}`)
    setError('')
    setNotice('')
    try {
      await load(userId)
    } finally {
      setBusy('')
    }
  }

  async function addHost(event) {
    event.preventDefault()
    const userId = String(newUserId || '').trim()
    if (!/^\d{5,20}$/.test(userId)) {
      setError('Enter a valid numeric Airbnb User ID.')
      return
    }
    setBusy('add')
    setError('')
    setNotice('')
    try {
      const payload = await apiFetch('/v1/booking-portals/airbnb/hosts', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
      setNewUserId('')
      applyPayload(payload)
      setNotice(payload?.message || 'Airbnb User ID added.')
    } catch (requestError) {
      setError(requestError?.message || 'Could not add Airbnb User ID.')
    } finally {
      setBusy('')
    }
  }

  async function toggleActive(host) {
    setBusy(`active-${host.userId}`)
    setError('')
    setNotice('')
    try {
      const payload = await apiFetch(`/v1/booking-portals/airbnb/hosts/${host.userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !host.isActive }),
      })
      applyPayload(payload)
      setNotice(payload?.message || (host.isActive ? 'User ID deactivated.' : 'User ID activated.'))
    } catch (requestError) {
      setError(requestError?.message || 'Could not update User ID status.')
    } finally {
      setBusy('')
    }
  }

  async function removeHost(host) {
    if (!window.confirm(`Remove Airbnb User ID ${host.userId}? Mappings for its listings will be cleared.`)) return
    setBusy(`remove-${host.userId}`)
    setError('')
    setNotice('')
    try {
      const payload = await apiFetch(`/v1/booking-portals/airbnb/hosts/${host.userId}`, {
        method: 'DELETE',
      })
      applyPayload(payload)
      setNotice(payload?.message || 'Airbnb User ID removed.')
    } catch (requestError) {
      setError(requestError?.message || 'Could not remove Airbnb User ID.')
    } finally {
      setBusy('')
    }
  }

  async function reload() {
    if (!selectedUserId) return
    setBusy('reload')
    setError('')
    setNotice('')
    try {
      const payload = await apiFetch('/v1/booking-portals/airbnb/accommodations/reload', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUserId }),
      })
      applyPayload(payload)
      setNotice(payload?.message || 'Airbnb accommodations reloaded.')
    } catch (requestError) {
      setError(requestError?.message || 'Could not reload accommodations.')
    } finally {
      setBusy('')
    }
  }

  async function save() {
    if (!selectedUserId) return
    setBusy('save')
    setError('')
    setNotice('')
    try {
      const payload = await apiFetch('/v1/booking-portals/airbnb/accommodations', {
        method: 'PUT',
        body: JSON.stringify({ userId: selectedUserId, mappings }),
      })
      applyPayload(payload)
      setNotice(payload?.message || 'Mappings saved.')
    } catch (requestError) {
      setError(requestError?.message || 'Could not save mappings.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <button
        type="button"
        onClick={() => navigate('/bookingportals')}
        className="mb-4 text-sm font-bold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        ← Back to Booking Portals
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-[#ffd4d6] bg-[#FF5A5F] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-[4.75rem] items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10">
              <img src="/portal-logos/airbnb.svg?v=3" alt="Airbnb" className="h-full w-full object-contain p-1.5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Airbnb hosts</h1>
              <p className="mt-1 text-sm text-white/85">
                Add multiple User IDs, set them active or inactive, then map listings to your units.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {notice ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
          ) : null}

          <form onSubmit={addHost} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-bold text-slate-900">Add Airbnb User ID</p>
            <p className="mt-1 text-xs text-slate-500">Capture all accommodation names for another host account.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={newUserId}
                onChange={(event) => setNewUserId(event.target.value.replace(/\D/g, ''))}
                placeholder="Input User ID"
                inputMode="numeric"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5A5F]/30 sm:flex-1"
              />
              <button
                type="submit"
                disabled={Boolean(busy) || loading}
                className="rounded-xl bg-[#FF5A5F] px-4 py-3 text-sm font-bold text-white hover:bg-[#e0484d] disabled:opacity-60 sm:min-w-[8rem]"
              >
                {busy === 'add' ? 'Adding…' : 'Add User ID'}
              </button>
            </div>
          </form>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Connected User IDs</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {typeof data?.hostCount === 'number' ? `${data.hostCount} host${data.hostCount === 1 ? '' : 's'}` : '—'}
                  {typeof data?.activeHostCount === 'number' ? ` · ${data.activeHostCount} active` : ''}
                  {typeof data?.totalListingCount === 'number' ? ` · ${data.totalListingCount} active listings` : ''}
                </p>
              </div>
            </div>

            {loading ? <p className="text-sm text-slate-500">Loading hosts…</p> : null}

            {!loading && hosts.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                No Airbnb User IDs yet. Add one above to capture accommodations.
              </p>
            ) : null}

            <div className="space-y-2">
              {!loading
                ? hosts.map((host) => {
                    const selected = host.userId === selectedUserId
                    return (
                      <div
                        key={host.userId}
                        className={`rounded-2xl border px-4 py-3 transition ${
                          selected
                            ? 'border-[#FF5A5F] bg-[#fff5f5] shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => selectHost(host.userId)}
                            disabled={Boolean(busy)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="font-mono text-base font-black text-slate-900">{host.userId}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {host.listingCount || 0} listing{(host.listingCount || 0) === 1 ? '' : 's'}
                              {host.capturedAt ? ` · ${new Date(host.capturedAt).toLocaleString()}` : ''}
                            </p>
                          </button>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                              host.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {host.isActive ? 'Active' : 'Inactive'}
                          </span>

                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() => toggleActive(host)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            {busy === `active-${host.userId}`
                              ? 'Updating…'
                              : host.isActive
                                ? 'Set inactive'
                                : 'Set active'}
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() => selectHost(host.userId)}
                            className={`rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-60 ${
                              selected
                                ? 'border border-[#FF5A5F] bg-[#FF5A5F] text-white'
                                : 'border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50'
                            }`}
                          >
                            {selected ? 'Mapping' : 'Map rooms'}
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(busy) || hosts.length <= 1}
                            onClick={() => removeHost(host)}
                            className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                          >
                            {busy === `remove-${host.userId}` ? 'Removing…' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    )
                  })
                : null}
            </div>
          </section>

          {selectedUserId ? (
            <section className="space-y-4 border-t border-slate-100 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Accommodations</h2>
                  <p className="text-sm text-slate-500">
                    Map Hofros units to listings for User ID <span className="font-mono font-semibold text-slate-700">{selectedUserId}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={Boolean(busy) || loading}
                  onClick={reload}
                  className="rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                >
                  {busy === 'reload' ? 'Reloading…' : 'Reload'}
                </button>
              </div>

              <p className="text-xs text-slate-500">
                {typeof data?.listingCount === 'number' ? `${data.listingCount} Airbnb listings captured` : '—'}
                {data?.capturedAt ? ` · ${new Date(data.capturedAt).toLocaleString()}` : ''}
                {data?.isActive === false ? ' · this User ID is inactive' : ''}
              </p>

              {!loading && units.length === 0 ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  No Hofros units found yet. Add units under Configuration, then reload this page to map them.
                </p>
              ) : null}

              {!loading
                ? units.map((unit) => (
                    <label key={unit.uuid} className="block">
                      <span className="mb-1 block text-sm font-semibold text-slate-800">
                        {unit.name}
                        {unit.propertyName ? (
                          <span className="ml-1 font-medium text-slate-500">· {unit.propertyName}</span>
                        ) : null}
                        {unit.mappedElsewhere ? (
                          <span className="ml-2 text-xs font-bold text-amber-700">Mapped to another User ID</span>
                        ) : null}
                      </span>
                      <div className="relative">
                        <select
                          value={mappings[unit.uuid] || ''}
                          onChange={(event) =>
                            setMappings((prev) => ({
                              ...prev,
                              [unit.uuid]: event.target.value || null,
                            }))
                          }
                          className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-3 pr-10 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#FF5A5F]/30"
                        >
                          <option value="">Select Airbnb listing…</option>
                          {listingOptions.map((listing) => (
                            <option key={listing.id} value={listing.id}>
                              {listing.label}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
                      </div>
                    </label>
                  ))
                : null}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={Boolean(busy) || loading}
                  onClick={save}
                  className="rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                >
                  {busy === 'save' ? 'Saving…' : 'Save mappings'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/bookingportals')}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
              onClick={() => navigate('/airbnb-connect')}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
            >
              Airbnb connection
            </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AirbnbAccommodationsPage
