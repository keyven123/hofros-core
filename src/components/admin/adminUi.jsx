export function AdminHeading({ kicker = 'Platform', title, description, children }) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a16207]">{kicker}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0b1020]">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </header>
  )
}

export function AdminPanel({ children, className = '' }) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)] ${className}`}>
      {children}
    </section>
  )
}

export function StatCard({ label, value, hint }) {
  return (
    <article className="rounded-2xl border border-[#e8e4dc] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 font-serif text-4xl font-medium tracking-tight text-[#0b1020]">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </article>
  )
}

export function AdminSearch({ value, onChange, placeholder }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-full border border-[#e8e4dc] bg-white px-4 text-sm text-slate-700 outline-none ring-[#c6a15b] placeholder:text-slate-400 focus:ring-2 sm:w-72"
    />
  )
}

export function Avatar({ name }) {
  const letter = (name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0b1020] text-xs font-semibold text-[#e8c872]">
      {letter}
    </span>
  )
}

export function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize tracking-wide ${statusClass(status)}`}>
      {statusLabel(status)}
    </span>
  )
}

const HEAD = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400'
const CELL = 'px-4 py-3.5 align-middle text-slate-700'

export function TableHead({ children }) {
  return <th className={HEAD}>{children}</th>
}

export function TableCell({ children, className = '' }) {
  return <td className={`${CELL} ${className}`}>{children}</td>
}

export function statusClass(status) {
  switch (status) {
    case 'active':
    case 'assigned':
    case 'accepted':
    case 'checked_in':
      return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
    case 'pending':
    case 'interested':
      return 'bg-amber-50 text-amber-800 ring-1 ring-amber-100'
    case 'contacted':
      return 'bg-sky-50 text-sky-800 ring-1 ring-sky-100'
    case 'onboarded':
      return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
    case 'target':
      return 'bg-[#f8f1de] text-[#8a5a12] ring-1 ring-[#ead7a4]'
    case 'cancelled':
    case 'inactive':
    case 'passed':
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
    case 'suspended':
      return 'bg-rose-50 text-rose-800 ring-1 ring-rose-100'
    case 'checked_out':
      return 'bg-sky-50 text-sky-800 ring-1 ring-sky-100'
    default:
      return 'bg-[#f8f1de] text-[#8a5a12] ring-1 ring-[#ead7a4]'
  }
}

export function statusLabel(status) {
  if (!status) return '—'
  return String(status).replace(/_/g, ' ')
}

export function matchesQuery(query, values) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = values.filter(Boolean).join(' ').toLowerCase()
  return words.every((word) => haystack.includes(word))
}

export function formatMoney(amount, currency = 'PHP') {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'PHP',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency || ''} ${Math.round(value)}`
  }
}
