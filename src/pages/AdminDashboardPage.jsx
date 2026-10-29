import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminHeading, AdminPanel, StatCard, StatusPill, formatMoney } from '../components/admin/adminUi'
import { adminFetch } from '../utils/adminApi'

const STATUS_COLOR = {
  pending: '#d97706',
  accepted: '#0284c7',
  assigned: '#059669',
  checked_in: '#0b1020',
  checked_out: '#64748b',
  cancelled: '#e11d48',
}

const chartTooltip = {
  contentStyle: {
    background: '#0b1020',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 12,
  },
  labelStyle: { color: '#e8c872' },
}

function AdminDashboardPage() {
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    adminFetch('/v1/admin/dashboard')
      .then((data) => {
        if (!cancelled) setPayload(data)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load the dashboard.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = payload?.counts ?? {}
  const months = payload?.bookingsByMonth ?? []
  const statuses = (payload?.statusBreakdown ?? []).filter((row) => row.count > 0)
  const merchants = payload?.merchants ?? []
  const upcoming = payload?.upcoming ?? []
  const recent = payload?.recentBookings ?? []
  const windowRevenue = months.reduce((sum, row) => sum + Number(row.revenue || 0), 0)
  const currency = recent.find((row) => row.currency)?.currency || 'PHP'

  return (
    <>
      <AdminHeading
        kicker="Overview"
        title="Dashboard"
        description="Live platform activity: stays, room inventory, and the merchants operating on Hofros."
      />

      {error ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/admin/merchants" className="block transition hover:-translate-y-0.5">
          <StatCard label="Merchants" value={payload ? counts.merchants ?? 0 : '—'} hint="Property accounts, excluding administrators" />
        </Link>
        <Link to="/admin/calendars" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="Rooms"
            value={payload ? counts.rooms ?? 0 : '—'}
            hint={payload ? `${counts.activeRooms ?? 0} listed as active` : 'Listed rooms across merchants'}
          />
        </Link>
        <Link to="/admin/bookings" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="Bookings"
            value={payload ? counts.bookings ?? 0 : '—'}
            hint={payload ? `${counts.inHouse ?? 0} in house today` : 'All reservations'}
          />
        </Link>
        <StatCard
          label="Customer accounts"
          value={payload ? counts.customers ?? 0 : '—'}
          hint="Guests who created a messaging account"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <AdminPanel className="p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#0b1020]">Bookings</h2>
              <p className="mt-1 text-xs text-slate-500">Check-ins from the past three months through the next two, excluding cancellations.</p>
            </div>
            <p className="text-right text-sm font-semibold text-[#0b1020]">
              {payload ? formatMoney(windowRevenue, currency) : '—'}
              <span className="mt-0.5 block text-[11px] font-medium text-slate-400">Value in this window</span>
            </p>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#efeae2" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="bookings" stroke="#0b1020" strokeWidth={2} fill="#e8c872" fillOpacity={0.55} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        <AdminPanel className="p-5">
          <h2 className="text-base font-semibold text-[#0b1020]">Booking status</h2>
          <p className="mt-1 text-xs text-slate-500">How current reservations are distributed.</p>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statuses.length ? statuses : [{ status: 'none', count: 1 }]} dataKey="count" nameKey="status" innerRadius={48} outerRadius={72} paddingAngle={2}>
                  {(statuses.length ? statuses : [{ status: 'none' }]).map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLOR[entry.status] || '#e8e4dc'} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2">
            {(payload?.statusBreakdown ?? []).map((row) => (
              <li key={row.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[row.status] || '#e8e4dc' }} />
                  <span className="capitalize">{row.status.replace(/_/g, ' ')}</span>
                </span>
                <span className="font-semibold tabular-nums text-[#0b1020]">{row.count}</span>
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminPanel className="p-5">
          <h2 className="text-base font-semibold text-[#0b1020]">Merchants</h2>
          <p className="mt-1 text-xs text-slate-500">Rooms and bookings for the busiest accounts.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={merchants} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#efeae2" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(value) => (String(value).length > 12 ? `${String(value).slice(0, 12)}…` : value)}
                />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="rooms" fill="#0b1020" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bookings" fill="#e8c872" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        <AdminPanel className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#0b1020]">Upcoming arrivals</h2>
              <p className="mt-1 text-xs text-slate-500">Next check-ins that are still on the books.</p>
            </div>
            <Link to="/admin/bookings" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a16207]">
              All bookings
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">{payload ? 'No upcoming arrivals.' : 'Loading arrivals…'}</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#f1ece4]">
              {upcoming.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#0b1020]">{row.guest || 'Guest'}</p>
                    <p className="truncate text-xs text-slate-500">
                      {[row.merchant, row.room, row.checkIn].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <StatusPill status={row.status} />
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>

      <AdminPanel className="mt-4">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-semibold text-[#0b1020]">Recent bookings</h2>
          <Link to="/admin/bookings" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a16207]">
            Open ledger
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-y border-[#f1ece4]">
                {['Guest', 'Merchant', 'Room', 'Stay', 'Value', 'Status'].map((label) => (
                  <th key={label} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr key={row.id} className="border-b border-[#f6f3ee] last:border-0">
                  <td className="px-5 py-3.5 font-semibold text-[#0b1020]">{row.guest || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.merchant || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-600">{row.room || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {row.checkIn} – {row.checkOut}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{formatMoney(row.total, row.currency)}</td>
                  <td className="px-5 py-3.5">
                    <StatusPill status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payload && recent.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">No bookings yet.</p> : null}
          {!payload && !error ? <p className="px-5 py-8 text-sm text-slate-500">Loading bookings…</p> : null}
        </div>
      </AdminPanel>
    </>
  )
}

export default AdminDashboardPage
