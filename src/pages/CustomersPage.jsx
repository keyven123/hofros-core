import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../utils/api'

function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [query, setQuery] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    apiFetch('/v1/customers')
      .then((data) => {
        if (!cancelled) {
          setCustomers(Array.isArray(data?.customers) ? data.customers : [])
          setLoadError('')
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setLoadError(cause instanceof Error ? cause.message : 'Could not load customers.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((customer) =>
      [customer.name, customer.address, customer.contactNumber, customer.email].some((value) =>
        String(value ?? '').toLowerCase().includes(q),
      ),
    )
  }, [customers, query])

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-[#f6f9ff] p-4">
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight text-[#0f3f73]">Customers</h1>
            <p className="text-xs text-slate-500">{loadError || 'Customer accounts that can message your property'}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#FDB927] px-3 py-1 text-xs font-black text-[#0f3f73]">
            {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
          </span>
        </header>

        <div className="px-4 py-3">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2">
            <span className="text-slate-400" aria-hidden="true">
              ⌕
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, address, contact, or email"
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              aria-label="Search customers"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {visible.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-500">
              {query.trim() ? 'No customers match your search.' : 'No customer accounts yet.'}
            </p>
          ) : (
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Full name</th>
                  <th className="px-4 py-2">Address</th>
                  <th className="px-4 py-2">Contact number</th>
                  <th className="px-4 py-2">Email address</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((customer) => (
                  <tr key={customer.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-[#0f3f73]">{customer.name || 'Customer'}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.address}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.contactNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomersPage
