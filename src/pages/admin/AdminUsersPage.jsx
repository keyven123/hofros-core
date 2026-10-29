import { useEffect, useMemo, useState } from 'react'
import { AdminHeading, AdminPanel, AdminSearch, Avatar, StatCard, TableCell, TableHead, matchesQuery } from '../../components/admin/adminUi'
import { adminFetch } from '../../utils/adminApi'

function AdminUsersPage() {
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    adminFetch('/v1/admin/users')
      .then((data) => {
        if (!cancelled) setRows(data.users ?? [])
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load users.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(
    () => rows.filter((row) => matchesQuery(query, [row.name, row.merchantName, row.email, row.role, row.contactNumber])),
    [rows, query],
  )
  const admins = rows.filter((row) => row.role === 'Platform admin').length
  const marketing = rows.filter((row) => row.role === 'Marketing').length
  const merchants = rows.filter((row) => row.role === 'Merchant').length

  return (
    <>
      <AdminHeading kicker="Access" title="User management" description="People who can sign in: platform administrators, marketing accounts, and merchant owners.">
        <AdminSearch value={query} onChange={setQuery} placeholder="Search users" />
      </AdminHeading>
      {error ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}
      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Accounts" value={loading ? '—' : rows.length} hint="Sign-in records" />
        <StatCard label="Platform admins" value={loading ? '—' : admins} hint="This console" />
        <StatCard label="Marketing" value={loading ? '—' : marketing} hint="Target market logins" />
        <StatCard label="Merchant owners" value={loading ? '—' : merchants} hint="Property dashboards" />
      </div>
      <AdminPanel>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[#f1ece4]">
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-[#f6f3ee] last:border-0 hover:bg-[#fbfaf6]">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} />
                    <span className="font-semibold text-[#0b1020]">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell>{row.merchantName}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.contactNumber || '—'}</TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      row.role === 'Platform admin'
                        ? 'bg-[#0b1020] text-[#e8c872]'
                        : row.role === 'Marketing'
                          ? 'bg-[#f8efd8] text-[#8a5a12]'
                          : 'bg-white text-slate-600 ring-1 ring-[#e8e4dc]'
                    }`}
                  >
                    {row.role}
                  </span>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && visible.length === 0 ? <p className="px-4 py-8 text-sm text-slate-500">No users match this search.</p> : null}
        {loading ? <p className="px-4 py-8 text-sm text-slate-500">Loading users…</p> : null}
      </AdminPanel>
    </>
  )
}

export default AdminUsersPage
