import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiDownloadFile, apiFetch } from '../utils/api'

function formatPhp(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) {
    return '₱0'
  }
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function formatPhpCompact(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) {
    return '₱0'
  }
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n)
}

function sourceColor(key) {
  const k = String(key || '').toLowerCase()
  const map = {
    direct: '#7DD3FC',
    manual: '#38BDF8',
    airbnb: '#F87171',
    booking_com: '#1E3A8A',
    expedia: '#FB923C',
    vrbo: '#A78BFA',
  }
  return map[k] || '#94A3B8'
}

function KpiCard({ title, value, subValue, changePct, icon }) {
  const positive = changePct >= 0
  return (
    <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-[#0f3f73]">{value}</p>
          {subValue != null && <p className="mt-0.5 text-xs text-slate-500">{subValue}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#2B5AED]">
          {icon}
        </div>
      </div>
      <p className={`mt-3 text-sm font-semibold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {positive ? '+' : ''}
        {changePct}% vs last year
      </p>
    </article>
  )
}

export default function AnalyticsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)

  const yearOptions = useMemo(() => {
    const years = []
    for (let y = currentYear + 1; y >= currentYear - 6; y -= 1) {
      years.push(y)
    }
    return years
  }, [currentYear])

  /* eslint-disable react-hooks/set-state-in-effect -- loading state tracks async fetch for selected year */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void apiFetch(`/v1/analytics?year=${year}`)
      .then((json) => {
        if (!cancelled) {
          setData(json)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load analytics.')
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [year])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleExport(granularity) {
    setExporting(granularity)
    setError(null)
    try {
      const q = new URLSearchParams({ year: String(year), granularity })
      await apiDownloadFile(`/v1/analytics/export?${q.toString()}`, `analytics-bookings-${year}-${granularity}.csv`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setExporting(null)
    }
  }

  const monthlyChartData = data?.monthly?.map((m) => ({
    ...m,
    revenueK: Math.round(m.revenue / 1000),
  }))

  const hasSources = data?.sources?.some((s) => s.count > 0)

  return (
    <div className="min-h-0 flex-1 space-y-4 p-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black tracking-tight text-[#0f3f73]">Analytics</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span className="sr-only">Year</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0f3f73] shadow-sm outline-none ring-blue-200 focus:ring-2"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <div className="flex flex-wrap gap-1.5">
            {['daily', 'weekly', 'monthly', 'yearly'].map((g) => (
              <button
                key={g}
                type="button"
                disabled={exporting !== null}
                onClick={() => handleExport(g)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold capitalize text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                {exporting === g ? '…' : `Export ${g}`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
      )}

      {loading && !data && (
        <p className="text-sm font-medium text-slate-500">Loading analytics…</p>
      )}

      {data && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total revenue"
              value={formatPhp(data.kpis.totalRevenue.value)}
              changePct={data.kpis.totalRevenue.changePct}
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
                </svg>
              }
            />
            <KpiCard
              title="Total bookings"
              value={String(Math.round(data.kpis.totalBookings.value))}
              changePct={data.kpis.totalBookings.changePct}
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                </svg>
              }
            />
            <KpiCard
              title="Avg. occupancy"
              value={`${data.kpis.avgOccupancy.value}%`}
              changePct={data.kpis.avgOccupancy.changePct}
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" strokeLinejoin="round" />
                </svg>
              }
            />
            <KpiCard
              title="Avg. daily rate (ADR)"
              value={formatPhpCompact(data.kpis.adr.value)}
              changePct={data.kpis.adr.changePct}
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M3 17 9 11l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <h2 className="text-base font-black text-[#0f3f73]">Revenue &amp; bookings</h2>
              <p className="mt-0.5 text-xs text-slate-500">By check-in month · {year}</p>
              <div className="mt-4 h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      stroke="#64748b"
                      tickFormatter={(v) => `₱${v}k`}
                    />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#64748b" allowDecimals={false} />
                    <Tooltip
                      formatter={(val, name) =>
                        name === 'revenue' ? [formatPhp(Number(val) * 1000), 'Revenue'] : [val, 'Bookings']
                      }
                      labelFormatter={(l) => l}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenueK" name="Revenue (₱, thousands)" fill="#2B5AED" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="bookings" name="Bookings" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <h2 className="text-base font-black text-[#0f3f73]">Booking sources</h2>
              <p className="mt-0.5 text-xs text-slate-500">Share of bookings · {year}</p>
              <div className="mt-4 flex h-[300px] flex-col items-center justify-center gap-4 sm:flex-row sm:items-center">
                {hasSources ? (
                  <>
                    <div className="h-[220px] w-full max-w-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.sources}
                            dataKey="count"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={82}
                            paddingAngle={2}
                          >
                            {data.sources.map((entry) => (
                              <Cell key={entry.key} fill={sourceColor(entry.key)} stroke="#fff" strokeWidth={1} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v, _n, p) => [`${v} (${p.payload.pct}%)`, p.payload.label]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="flex w-full max-w-xs flex-col gap-2 text-sm">
                      {data.sources.map((s) => (
                        <li key={s.key} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 font-medium text-slate-700">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: sourceColor(s.key) }} />
                            {s.label}
                          </span>
                          <span className="font-semibold text-[#0f3f73]">{s.pct}%</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No booking source data for this year.</p>
                )}
              </div>
            </article>
          </div>

          <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-[#0f3f73]">Occupancy rate</h2>
            <p className="mt-0.5 text-xs text-slate-500">Portfolio average · room-nights vs capacity</p>
            <div className="mt-4 h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.occupancyByMonth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Occupancy']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Line type="monotone" dataKey="occupancyPct" name="Occupancy" stroke="#2B5AED" strokeWidth={2} dot={{ r: 4, fill: '#2B5AED' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-[#0f3f73]">Unit performance</h2>
            <p className="mt-0.5 text-xs text-slate-500">Active units · revenue by check-in in {year}</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pr-4">Unit</th>
                    <th className="pb-2 pr-4">Total revenue</th>
                    <th className="pb-2 pr-4">Bookings</th>
                    <th className="pb-2 pr-4">Occupancy</th>
                    <th className="pb-2">Avg. daily rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.units.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No active units configured.
                      </td>
                    </tr>
                  )}
                  {data.units.map((u) => (
                    <tr key={u.unitId} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 font-semibold text-[#0f3f73]">{u.name}</td>
                      <td className="py-3 pr-4 font-medium text-slate-800">{formatPhp(u.totalRevenue)}</td>
                      <td className="py-3 pr-4 text-slate-700">{u.bookings}</td>
                      <td className="py-3 pr-4 text-slate-700">{u.occupancyPct}%</td>
                      <td className="py-3 text-slate-800">{formatPhpCompact(u.adr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}
    </div>
  )
}
