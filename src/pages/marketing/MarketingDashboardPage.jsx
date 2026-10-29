import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPanel, StatCard, TableCell, TableHead, statusClass } from '../../components/admin/adminUi'
import { marketingFetch } from '../../utils/marketingApi'

const STAGE = {
  target: 'Target',
  contacted: 'Contacted',
  interested: 'Interested',
  onboarded: 'Onboarded',
  passed: 'Not pursuing',
}

function MarketingDashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    marketingFetch('/v1/marketing/home')
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load the dashboard.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = data?.counts
  const recent = (data?.prospects ?? []).slice(0, 5)

  return (
    <>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a16207]">Marketing</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0b1020]">{data?.account?.name || 'Dashboard'}</h1>
          <p className="mt-2 text-sm text-slate-500">Your assigned target markets and clients.</p>
        </div>
        <Link to="/marketing/targets" className="h-10 rounded-full bg-[#0b1020] px-4 text-xs font-semibold leading-10 text-[#e8c872]">
          Open targets
        </Link>
      </header>
      {error ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Targets" value={counts ? counts.total : '—'} hint="Assigned to you" />
        <StatCard label="Markets" value={counts ? counts.markets : '—'} hint="Prospect hotels" />
        <StatCard label="Clients" value={counts ? counts.clients : '—'} hint="People to onboard" />
        <StatCard label="Onboarded" value={counts ? counts.onboarded : '—'} hint="Already on Hofros" />
      </div>
      <AdminPanel>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#f1ece4]">
            <tr>
              <TableHead>Target</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Stage</TableHead>
            </tr>
          </thead>
          <tbody>
            {recent.map((row) => (
              <tr key={row.id} className="border-b border-[#f6f3ee] last:border-0">
                <TableCell className="font-semibold text-[#0b1020]">{row.name}</TableCell>
                <TableCell>{row.location || '—'}</TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(row.status)}`}>{STAGE[row.status] || row.status}</span>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
        {data && recent.length === 0 ? <p className="px-4 py-8 text-sm text-slate-500">No targets are assigned to this account yet.</p> : null}
      </AdminPanel>
    </>
  )
}

export default MarketingDashboardPage
