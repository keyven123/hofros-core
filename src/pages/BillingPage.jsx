import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FreeTrialBanner from '../components/billing/FreeTrialBanner'
import { apiFetch } from '../utils/api'

function money(amount, currency = 'PHP') {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${currency} ${Math.round(value)}`
  }
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

const TABS = [
  { id: 'billing', label: 'Billing' },
  { id: 'history', label: 'Payment history' },
]

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function BillingPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('billing')
  const [invoice, setInvoice] = useState(null)
  const [payments, setPayments] = useState([])
  const [paymentsLoaded, setPaymentsLoaded] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function apply(data) {
    setInvoice(data?.invoice ?? data)
  }

  useEffect(() => {
    let cancelled = false
    apiFetch('/v1/subscription')
      .then((data) => {
        if (!cancelled) apply(data)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load billing.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (tab !== 'history' || paymentsLoaded) return
    let cancelled = false
    apiFetch('/v1/subscription/payments')
      .then((data) => {
        if (!cancelled) setPayments(data?.payments ?? [])
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load payment history.')
      })
      .finally(() => {
        if (!cancelled) setPaymentsLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [tab, paymentsLoaded])

  function pay() {
    navigate('/billing/checkout')
  }

  const rooms = invoice?.items?.find((item) => item.type === 'rooms')
  const modules = invoice?.items?.filter((item) => item.type === 'addon' && Number(item.amount) > 0) ?? []
  const roomsSubtotal = Number(invoice?.roomsSubtotal ?? rooms?.amount ?? 0)
  const modulesSubtotal = Number(invoice?.modulesSubtotal ?? modules.reduce((sum, item) => sum + Number(item.amount || 0), 0))
  const suspended = invoice?.accountStatus === 'suspended'
  const onTrial = Boolean(invoice?.trial?.active)
  const estimate = invoice?.postTrialEstimate

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f9ff] p-4">
      <div className="flex shrink-0 items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0f3f73]">Billing</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {onTrial
              ? `You are on a ${invoice.trial.totalDays || 30}-day free trial. No payment is required until the trial ends.`
              : `Registered ${formatDate(invoice?.registeredOn)}. Each bill is due one month later, on the same date.`}
          </p>
        </div>
        <p
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            suspended
              ? 'bg-rose-50 text-rose-700'
              : onTrial
                ? 'bg-amber-50 text-amber-800'
                : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {invoice ? (suspended ? 'Temporarily inactive' : onTrial ? 'Free trial' : 'Active') : 'Loading'}
        </p>
      </div>

      {onTrial ? (
        <div className="mt-3 shrink-0">
          <FreeTrialBanner
            trial={invoice.trial}
            estimate={estimate}
            currency={invoice.currency}
            showCta={false}
          />
        </div>
      ) : null}

      {suspended ? (
        <p className="mt-3 shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          This account is temporarily inactive because the {formatDate(invoice.dueOn)} payment was missed. Pay to restore access.
        </p>
      ) : null}
      {error ? <p className="mt-3 shrink-0 text-sm font-medium text-rose-600">{error}</p> : null}
      {notice ? <p className="mt-3 shrink-0 text-sm font-medium text-emerald-700">{notice}</p> : null}

      <div className="mt-3 flex shrink-0 gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === item.id ? 'bg-white text-[#0f3f73] shadow-sm ring-1 ring-slate-200' : 'text-slate-600'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid shrink-0 grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_auto_auto] gap-3 border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <span>Billing date</span>
            <span>Paid on</span>
            <span>Status</span>
            <span className="text-right">Amount</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!paymentsLoaded ? <p className="px-4 py-6 text-sm text-slate-500">Loading payment history…</p> : null}
            {paymentsLoaded && payments.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">
                {onTrial
                  ? 'No payments yet. Your free trial has no charges until it ends.'
                  : 'No payments yet. Completed payments appear here.'}
              </p>
            ) : null}
            {payments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_auto_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm">
                <span className="font-semibold text-[#0f3f73]">{formatDate(payment.dueOn)}</span>
                <span className="text-slate-600">{formatDateTime(payment.paidAt)}</span>
                <span className="w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-700">Paid</span>
                <span className="text-right font-semibold text-slate-800">{money(payment.amount, payment.currency)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === 'billing' ? (
      <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <span>{onTrial ? 'Included in trial' : 'Statement'}</span>
            <span>{onTrial ? 'After trial' : 'Amount'}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {onTrial ? (
              <div className="border-b border-slate-100 bg-[#fff8e8] px-4 py-3 text-sm text-[#0f3f73]">
                Everything below is free until {formatDate(invoice.trial.endsOn)}. The amounts are what you would pay after the trial.
              </div>
            ) : null}
            {rooms ? (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-slate-100 px-4 py-2.5">
                <span>
                  <span className="block text-sm font-semibold text-[#0f3f73]">Rooms</span>
                  <span className="text-xs text-slate-500">
                    {rooms.quantity} active {rooms.quantity === 1 ? 'room' : 'rooms'} × {money(rooms.unitPrice, invoice.currency)}
                  </span>
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {money(onTrial ? estimate?.roomsSubtotal ?? rooms.amount : rooms.amount, invoice.currency)}
                </span>
              </div>
            ) : null}
            {modules.map((item) => (
              <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-slate-100 px-4 py-2.5">
                <span>
                  <span className="block text-sm font-semibold text-[#0f3f73]">{item.label}</span>
                  <span className="text-xs text-slate-500">{onTrial ? 'Included in trial' : 'Activated'}</span>
                </span>
                <span className="text-sm font-semibold text-slate-800">{money(item.amount, invoice.currency)}</span>
              </div>
            ))}
            {!invoice && !error ? <p className="px-4 py-6 text-sm text-slate-500">Loading the statement…</p> : null}
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-[#f8fbff] px-4 py-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
              <span className="text-slate-600">Rooms subtotal</span>
              <span className="font-semibold text-slate-800">
                {invoice ? money(onTrial ? estimate?.roomsSubtotal ?? 0 : roomsSubtotal, invoice.currency) : '—'}
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
              <span className="text-slate-600">Modules subtotal · {modules.length}</span>
              <span className="font-semibold text-slate-800">
                {invoice ? money(onTrial ? estimate?.modulesSubtotal ?? 0 : modulesSubtotal, invoice.currency) : '—'}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-slate-200 pt-2">
              <span className="text-sm font-black text-[#0f3f73]">
                {onTrial ? 'Due now (trial)' : 'Amount due'}
              </span>
              <span className="text-sm font-black text-[#0f3f73]">
                {invoice ? money(invoice.total, invoice.currency) : '—'}
              </span>
            </div>
            {onTrial ? (
              <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
                <span className="text-slate-600">After trial estimate</span>
                <span className="font-semibold text-slate-800">
                  {money(estimate?.total ?? 0, invoice.currency)}
                </span>
              </div>
            ) : null}
          </div>
        </section>

        <aside
          className={`flex shrink-0 flex-col justify-between rounded-xl border p-5 ${
            onTrial ? 'border-amber-200 bg-gradient-to-b from-[#fff8e8] to-white' : 'border-slate-200 bg-white'
          }`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {onTrial ? 'Trial ends' : 'Due date'}
            </p>
            <p className="mt-1 text-lg font-black text-[#0f3f73]">
              {formatDate(onTrial ? invoice?.trial?.endsOn : invoice?.dueOn)}
            </p>
            {onTrial ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-white px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Trial countdown</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-5xl font-black leading-none tabular-nums text-[#0d3f71]">
                    {invoice.trial.daysRemaining}
                  </p>
                  <p className="pb-1 text-sm font-bold uppercase tracking-wide text-amber-700">
                    day{invoice.trial.daysRemaining === 1 ? '' : 's'} left
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          4,
                          Math.round(
                            ((Math.max(1, Number(invoice.trial.totalDays) || 30) -
                              Math.max(0, Number(invoice.trial.daysRemaining) || 0)) /
                              Math.max(1, Number(invoice.trial.totalDays) || 30)) *
                              100,
                          ),
                        ),
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  No payment is required during the free trial. You can keep exploring rooms, bookings, and modules.
                </p>
              </div>
            ) : (
              <>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Breakdown</p>
                <div className="mt-2 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Rooms subtotal</span>
                    <span className="font-semibold text-slate-800">{invoice ? money(roomsSubtotal, invoice.currency) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Modules subtotal</span>
                    <span className="font-semibold text-slate-800">{invoice ? money(modulesSubtotal, invoice.currency) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                    <span className="font-black text-[#0f3f73]">Amount due</span>
                    <span className="font-black text-[#0f3f73]">{invoice ? money(invoice.total, invoice.currency) : '—'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          {onTrial ? (
            <button
              type="button"
              disabled
              className="mt-5 h-11 rounded-xl border border-amber-200 bg-white text-sm font-black text-amber-800 disabled:opacity-100"
            >
              No payment needed during trial
            </button>
          ) : (
            <button
              type="button"
              onClick={pay}
              disabled={!invoice || Number(invoice.total) <= 0}
              className="mt-5 h-11 rounded-xl bg-[#2B5AED] text-sm font-black text-white disabled:opacity-50"
            >
              {`Pay ${invoice ? money(invoice.total, invoice.currency) : ''}`}
            </button>
          )}
        </aside>
      </div>
      ) : null}
    </div>
  )
}

export default BillingPage
