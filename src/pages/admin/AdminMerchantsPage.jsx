import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminHeading, AdminPanel, AdminSearch, Avatar, StatCard, TableCell, TableHead, matchesQuery } from '../../components/admin/adminUi'
import { adminFetch } from '../../utils/adminApi'

function AdminMerchantsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    adminFetch('/v1/admin/merchants')
      .then((data) => {
        if (!cancelled) setRows(data.merchants ?? [])
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load merchants.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(
    () => rows.filter((row) => matchesQuery(query, [row.name, row.contactName, row.email, row.contactNumber, row.address])),
    [rows, query],
  )
  const withRooms = rows.filter((row) => row.rooms > 0).length

  return (
    <>
      <AdminHeading kicker="Overview" title="Merchants" description="Property accounts operating on Hofros. Platform administrators are kept out of this list.">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search merchants" />
      </AdminHeading>
      {error ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Accounts" value={loading ? '—' : rows.length} hint="Merchant owners" />
        <StatCard label="With rooms" value={loading ? '—' : withRooms} hint="Ready to take a stay" />
        <StatCard label="Without rooms" value={loading ? '—' : rows.length - withRooms} hint="Still setting up inventory" />
      </div>
      <AdminPanel>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-[#f1ece4]">
            <tr>
              <TableHead>Merchant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Rooms</TableHead>
              <TableHead>Bookings</TableHead>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.id}
                tabIndex={0}
                role="link"
                aria-label={`View ${row.name}`}
                onClick={() => navigate(`/admin/merchants/${row.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/admin/merchants/${row.id}`)
                  }
                }}
                className="cursor-pointer border-b border-[#f6f3ee] last:border-0 hover:bg-[#fbfaf6] focus:bg-[#fbfaf6] focus:outline-none"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} />
                    <div>
                      <p className="font-semibold text-[#0b1020]">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.address || 'No address'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{row.contactName}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.contactNumber || '—'}</TableCell>
                <TableCell className="tabular-nums font-semibold text-[#0b1020]">{row.rooms}</TableCell>
                <TableCell className="tabular-nums font-semibold text-[#0b1020]">{row.bookings}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && visible.length === 0 ? <p className="px-4 py-8 text-sm text-slate-500">No merchants match this search.</p> : null}
        {loading ? <p className="px-4 py-8 text-sm text-slate-500">Loading merchants…</p> : null}
      </AdminPanel>
    </>
  )
}

export default AdminMerchantsPage
