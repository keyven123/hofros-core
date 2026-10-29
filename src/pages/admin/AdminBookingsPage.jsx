import { useEffect, useMemo, useState } from 'react'
import { AdminHeading, AdminPanel, AdminSearch, StatCard, StatusPill, TableCell, TableHead, formatMoney, matchesQuery, statusLabel } from '../../components/admin/adminUi'
import { adminFetch } from '../../utils/adminApi'

function AdminBookingsPage() {
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    adminFetch('/v1/admin/bookings')
      .then((data) => {
        if (!cancelled) setRows(data.bookings ?? [])
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load bookings.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const statuses = useMemo(() => {
    const counts = new Map()
    rows.forEach((row) => counts.set(row.status, (counts.get(row.status) || 0) + 1))
    return [...counts.entries()]
  }, [rows])

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        if (status !== 'all' && row.status !== status) return false
        return matchesQuery(query, [row.reference, row.merchant, row.room, row.guest, row.email, row.phone, row.status])
      }),
    [rows, query, status],
  )

  return (
    <>
      <AdminHeading kicker="Reservations" title="Bookings" description="The platform ledger. Every reservation, from every merchant, in one view.">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search bookings" />
      </AdminHeading>
      {error ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="On this page" value={loading ? '—' : rows.length} hint="Latest 200 reservations" />
        <StatCard label="Showing" value={loading ? '—' : visible.length} hint={status === 'all' ? 'All statuses' : statusLabel(status)} />
        <StatCard label="Merchants" value={loading ? '—' : new Set(rows.map((row) => row.merchant).filter(Boolean)).size} hint="Accounts with a booking" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={status === 'all'} onClick={() => setStatus('all')} label={`All ${rows.length}`} />
        {statuses.map(([key, count]) => (
          <FilterChip key={key} active={status === key} onClick={() => setStatus(key)} label={`${statusLabel(key)} ${count}`} />
        ))}
      </div>
      <AdminPanel>
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-[#f1ece4]">
            <tr>
              <TableHead>Reference</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Stay</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-[#f6f3ee] last:border-0 hover:bg-[#fbfaf6]">
                <TableCell className="font-semibold text-[#0b1020]">{row.reference}</TableCell>
                <TableCell>{row.merchant || '—'}</TableCell>
                <TableCell>{row.room || '—'}</TableCell>
                <TableCell>
                  <p className="font-medium text-[#0b1020]">{row.guest || '—'}</p>
                  <p className="text-xs text-slate-500">{row.email || row.phone || ''}</p>
                </TableCell>
                <TableCell>
                  {row.checkIn} – {row.checkOut}
                </TableCell>
                <TableCell>{formatMoney(row.total, row.currency)}</TableCell>
                <TableCell>
                  <StatusPill status={row.status} />
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && visible.length === 0 ? <p className="px-4 py-8 text-sm text-slate-500">No bookings match this view.</p> : null}
        {loading ? <p className="px-4 py-8 text-sm text-slate-500">Loading bookings…</p> : null}
      </AdminPanel>
    </>
  )
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
        active ? 'bg-[#0b1020] text-[#e8c872]' : 'bg-white text-slate-600 ring-1 ring-[#e8e4dc]'
      }`}
    >
      {label}
    </button>
  )
}

export default AdminBookingsPage
