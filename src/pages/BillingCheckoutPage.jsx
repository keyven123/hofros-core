import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

function BillingCheckoutPage() {
  const [params] = useSearchParams()
  const reference = params.get('ref')
  const cancelled = params.get('cancelled') === '1'
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [starting, setStarting] = useState(false)
  const [confirming, setConfirming] = useState(Boolean(reference))

  useEffect(() => {
    let cancelledRequest = false
    apiFetch('/v1/subscription')
      .then((data) => {
        if (!cancelledRequest) setInvoice(data?.invoice ?? data)
      })
      .catch((requestError) => {
        if (!cancelledRequest) setError(requestError?.message || 'Could not load the checkout.')
      })
    return () => {
      cancelledRequest = true
    }
  }, [])

  useEffect(() => {
    if (!reference) return
    let cancelledRequest = false
    apiFetch('/v1/subscription/checkout/confirm', {
      method: 'POST',
      body: JSON.stringify({ reference }),
    })
      .then((data) => {
        if (cancelledRequest) return
        setInvoice(data.invoice)
        setNotice(`Payment received. The next billing date is ${formatDate(data.invoice?.dueOn)}.`)
      })
      .catch((requestError) => {
        if (!cancelledRequest) setError(requestError?.message || 'Payment was not completed.')
      })
      .finally(() => {
        if (!cancelledRequest) setConfirming(false)
      })
    return () => {
      cancelledRequest = true
    }
  }, [reference])

  async function startCheckout() {
    setError('')
    setStarting(true)
    try {
      const data = await apiFetch('/v1/subscription/checkout', { method: 'POST' })
      if (!data.checkoutUrl) {
        setError('PayMongo did not return a checkout page.')
        setStarting(false)
        return
      }
      window.location.assign(data.checkoutUrl)
    } catch (requestError) {
      setError(requestError?.message || 'Could not start the payment.')
      setStarting(false)
    }
  }

  const rooms = Number(invoice?.roomsSubtotal ?? 0)
  const modules = Number(invoice?.modulesSubtotal ?? 0)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f9ff] p-4">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Checkout</p>
          <h1 className="text-xl font-black tracking-tight text-[#0f3f73]">Pay subscription</h1>
        </div>
        <Link to="/billing" className="text-sm font-semibold text-[#2B5AED]">Back to billing</Link>
      </div>

      {cancelled && !notice ? <p className="mt-3 shrink-0 text-sm font-medium text-amber-700">Payment was cancelled. You can try again.</p> : null}
      {error ? <p className="mt-3 shrink-0 text-sm font-medium text-rose-600">{error}</p> : null}
      {notice ? <p className="mt-3 shrink-0 text-sm font-medium text-emerald-700">{notice}</p> : null}

      <div className="mx-auto mt-4 flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Due {formatDate(invoice?.dueOn)}</p>
          <p className="mt-1 font-serif text-4xl text-[#0f3f73]">{invoice ? money(invoice.total, invoice.currency) : '—'}</p>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Rooms subtotal</span>
            <span className="font-semibold text-slate-800">{invoice ? money(rooms, invoice.currency) : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Modules subtotal</span>
            <span className="font-semibold text-slate-800">{invoice ? money(modules, invoice.currency) : '—'}</span>
          </div>
          {(invoice?.items ?? []).filter((item) => item.type === 'addon' && Number(item.amount) > 0).map((item) => (
            <div key={item.key} className="flex items-center justify-between pl-3 text-xs text-slate-500">
              <span>{item.label}</span>
              <span>{money(item.amount, invoice.currency)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="font-black text-[#0f3f73]">Amount due</span>
            <span className="font-black text-[#0f3f73]">{invoice ? money(invoice.total, invoice.currency) : '—'}</span>
          </div>
        </div>
        <div className="shrink-0 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={startCheckout}
            disabled={!invoice || starting || confirming || Boolean(notice) || Number(invoice?.total) <= 0}
            className="h-11 w-full rounded-xl bg-[#2B5AED] text-sm font-black text-white disabled:opacity-50"
          >
            {confirming ? 'Confirming payment…' : starting ? 'Opening PayMongo…' : notice ? 'Paid' : 'Continue to PayMongo'}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">Card, GCash, Maya, GrabPay, or QR Ph. Sandbox keys are in use.</p>
        </div>
      </div>
    </div>
  )
}

export default BillingCheckoutPage
