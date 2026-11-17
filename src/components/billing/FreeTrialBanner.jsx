import { Link } from 'react-router-dom'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function FreeTrialBanner({
  trial,
  estimate,
  currency = 'PHP',
  compact = false,
  to = '/billing',
  showCta = true,
}) {
  if (!trial?.active) return null

  const days = Math.max(0, Number(trial.daysRemaining) || 0)
  const total = Math.max(1, Number(trial.totalDays) || 30)
  const elapsed = Math.min(total, total - days)
  const progress = Math.round((elapsed / total) * 100)
  const urgent = days <= 7

  const estimateLabel = (() => {
    const amount = Number(estimate?.total)
    if (!Number.isFinite(amount) || amount <= 0) return null
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount)
    } catch {
      return `${currency} ${Math.round(amount)}`
    }
  })()

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border shadow-sm ${
        urgent
          ? 'border-amber-300 bg-gradient-to-br from-[#fff7df] via-white to-[#ffe8c7]'
          : 'border-[#c7dbf5] bg-gradient-to-br from-[#eef6ff] via-white to-[#fff8e8]'
      } ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-sky-300/20 blur-2xl" />

      <div className={`relative flex flex-col gap-4 ${compact ? 'lg:flex-row lg:items-center lg:justify-between' : ''}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                urgent ? 'bg-amber-500 text-white' : 'bg-[#0c4a84] text-white'
              }`}
            >
              Free trial
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Ends {formatDate(trial.endsOn)}
            </span>
          </div>

          <h2 className={`mt-2 font-black tracking-tight text-[#0d3f71] ${compact ? 'text-lg' : 'text-2xl'}`}>
            {days === 0
              ? 'Your free trial ends today'
              : days === 1
                ? '1 day left in your free trial'
                : `${days} days left in your free trial`}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Explore Hofros with no billing during the trial.
            {estimateLabel ? ` After that, your plan estimate is about ${estimateLabel}/month.` : null}
          </p>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span>
                {elapsed === 0 ? 'Trial just started' : `${elapsed} of ${total} days used`}
              </span>
              <span>{days} day{days === 1 ? '' : 's'} left</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className={`h-full rounded-full transition-all ${
                  urgent
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'bg-gradient-to-r from-[#2B5AED] to-teal-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(elapsed === 0 ? 3 : 4, progress))}%` }}
              />
            </div>
          </div>
        </div>

        <div className={`flex shrink-0 flex-col gap-2 ${compact ? 'sm:flex-row lg:flex-col' : 'sm:flex-row'}`}>
          <div className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Days left</p>
            <p className={`font-black tabular-nums text-[#0d3f71] ${compact ? 'text-3xl' : 'text-4xl'}`}>
              {days}
            </p>
          </div>
          {showCta ? (
            <Link
              to={to}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-3 text-sm font-black text-[#0f3f72] shadow-[0_10px_22px_rgba(245,158,11,0.28)] transition hover:-translate-y-0.5"
            >
              View trial billing
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default FreeTrialBanner
