import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch, unwrapJsonResourceData } from '../utils/api'
import { guestPortalCurrencySymbol } from '../utils/formatGuestPortalUnit'

function formatMoney(amount, currency) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  return `${guestPortalCurrencySymbol(currency)}${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function PaymentOptionCard({
  selected,
  disabled,
  title,
  amount,
  hint,
  primaryColor,
  onSelect,
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`relative rounded-2xl border-2 px-4 py-5 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
        selected ? 'text-white shadow-md' : 'bg-white text-slate-900 hover:bg-slate-50'
      }`}
      style={
        selected
          ? { backgroundColor: primaryColor, borderColor: primaryColor }
          : { borderColor: '#cbd5e1', color: '#0f172a' }
      }
    >
      <span
        className={`absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 ${
          selected ? 'border-white bg-white' : 'border-slate-300 bg-white'
        }`}
        aria-hidden="true"
      >
        {selected ? (
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
        ) : null}
      </span>
      <p
        className={`text-xs font-black uppercase tracking-[0.14em] ${
          selected ? 'text-white/85' : 'text-slate-500'
        }`}
      >
        {title}
      </p>
      <p className="mt-2 text-2xl font-black tabular-nums">{amount}</p>
      <p className={`mt-2 text-xs font-medium ${selected ? 'text-white/90' : 'text-slate-600'}`}>{hint}</p>
    </button>
  )
}

function DirectPortalCheckoutPage() {
  const { merchantSlug, batchId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paymentMode, setPaymentMode] = useState('full')
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [portal, setPortal] = useState(null)

  const portalPath = `/${merchantSlug}/directportal`
  const fallbackTitle = useMemo(() => {
    if (!merchantSlug) return 'Host'
    return merchantSlug
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }, [merchantSlug])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError('')
      try {
        const [checkoutData, portalData] = await Promise.all([
          apiFetch(
            `/v1/public/direct-portals/${encodeURIComponent(merchantSlug)}/checkout/${encodeURIComponent(batchId)}`,
          ),
          apiFetch(`/v1/public/direct-portals/${encodeURIComponent(merchantSlug)}`).catch(() => null),
        ])
        if (cancelled) return
        setSummary(checkoutData)
        setPortal(portalData ? unwrapJsonResourceData(portalData) : null)
        setPaymentMode('full')
      } catch (requestError) {
        if (!cancelled) setError(requestError?.message || 'Could not load checkout.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [merchantSlug, batchId])

  async function proceedToPay() {
    if (!paymentMode) {
      setError('Select Pay now or Pay reservation first.')
      return
    }
    setPaying(true)
    setError('')
    try {
      const data = await apiFetch(
        `/v1/public/direct-portals/${encodeURIComponent(merchantSlug)}/checkout/${encodeURIComponent(batchId)}/pay`,
        {
          method: 'POST',
          body: JSON.stringify({ mode: paymentMode }),
        },
      )
      if (typeof data?.checkoutUrl === 'string' && data.checkoutUrl.trim()) {
        window.location.assign(data.checkoutUrl)
        return
      }
      setError('The payment gateway did not return a checkout link.')
    } catch (requestError) {
      setError(requestError?.message || 'Could not start payment.')
    } finally {
      setPaying(false)
    }
  }

  const primaryColor =
    typeof portal?.primaryColor === 'string' && portal.primaryColor.trim()
      ? portal.primaryColor.trim()
      : '#0d9488'
  const title = portal?.merchantName?.trim() || fallbackTitle
  const currency = summary?.currency || 'PHP'
  const providerLabel = summary?.paymentGateway?.providerLabel || portal?.paymentGateway?.providerLabel || 'online payment'
  const alreadyPaid = Boolean(summary?.alreadyPaid)
  const canPay = Boolean(summary?.paymentGateway) && Number(summary?.totalAmount) > 0 && !alreadyPaid
  const totalAmount = Number(summary?.totalAmount) || 0
  const reservationAmount = Number(summary?.reservationAmount) || Math.round(totalAmount * 50) / 100
  const selectedAmount = paymentMode === 'reservation' ? reservationAmount : totalAmount

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/90 px-4">
        <p className="text-sm font-semibold text-slate-600">Loading checkout…</p>
      </div>
    )
  }

  if (error && !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200/90 px-4 py-10">
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-black text-slate-900">Checkout unavailable</h1>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => navigate(portalPath)}
            className="mt-6 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Back to {title}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(portalPath)}
            className="text-sm font-bold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            ← Back to listings
          </button>
          <p className="text-xs font-semibold text-slate-400">{title}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/[0.08]">
          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <h1 className="text-2xl font-black uppercase tracking-wide text-[#0f3f73] sm:text-3xl">Checkout</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review your stay, choose pay now or a 50% reservation, then proceed through {providerLabel}.
            </p>
          </div>

          <div className="space-y-5 px-6 py-6 sm:px-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Guest</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{summary?.guestName || '—'}</p>
                <p className="mt-0.5 text-xs text-slate-600">{summary?.guestEmail || '—'}</p>
                <p className="text-xs text-slate-600">{summary?.guestPhone || '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Stay</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDate(summary?.checkIn)} → {formatDate(summary?.checkOut)}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {summary?.adults ?? 0} adult{(summary?.adults ?? 0) === 1 ? '' : 's'}
                  {(summary?.children ?? 0) > 0 ? ` · ${summary.children} children` : ''}
                  {summary?.unitCount > 1 ? ` · ${summary.unitCount} units` : ''}
                </p>
                <p className="mt-2 font-mono text-[11px] font-semibold text-slate-700">
                  Ref: {(summary?.references || []).join(', ') || summary?.reference || '—'}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl border px-4 py-4"
              style={{ borderColor: `${primaryColor}33`, backgroundColor: `${primaryColor}10` }}
            >
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: primaryColor }}>
                Stay total
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums text-slate-900">
                {formatMoney(totalAmount, currency)}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-600">
                Reservation option: {formatMoney(reservationAmount, currency)} (50%)
              </p>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
            ) : null}

            {alreadyPaid ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Payment received
                {summary?.paidAmount != null ? ` (${formatMoney(summary.paidAmount, currency)})` : ''}. {title} will
                follow up with stay details.
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-800">How would you like to pay?</p>
                  <p className="mt-1 text-xs text-slate-500">Select one option, then click Proceed.</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment option">
                  <PaymentOptionCard
                    selected={paymentMode === 'full'}
                    disabled={!canPay || paying}
                    title="Pay now"
                    amount={formatMoney(totalAmount, currency)}
                    hint={`Pay the full amount with ${providerLabel}`}
                    primaryColor={primaryColor}
                    onSelect={() => setPaymentMode('full')}
                  />
                  <PaymentOptionCard
                    selected={paymentMode === 'reservation'}
                    disabled={!canPay || paying}
                    title="Pay reservation"
                    amount={formatMoney(reservationAmount, currency)}
                    hint="Pay 50% now to reserve. Balance due later."
                    primaryColor={primaryColor}
                    onSelect={() => setPaymentMode('reservation')}
                  />
                </div>
              </>
            )}

            {!summary?.paymentGateway && !alreadyPaid ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Online payment is not available right now. Your booking request is still saved — {title} will contact
                you.
              </p>
            ) : null}

            {summary?.paymentGateway && totalAmount <= 0 && !alreadyPaid ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                This stay total is ₱0, so online payment cannot start. Your booking request is still saved.
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-xs font-semibold text-slate-500 sm:text-left">
                {alreadyPaid
                  ? 'Payment already completed.'
                  : canPay
                    ? `Selected: ${paymentMode === 'reservation' ? 'Pay reservation' : 'Pay now'} · ${formatMoney(selectedAmount, currency)}`
                    : 'Payment options unavailable.'}
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate(portalPath)}
                  disabled={paying}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto sm:min-w-[7.5rem]"
                >
                  Cancel
                </button>
                {!alreadyPaid ? (
                  <button
                    type="button"
                    onClick={proceedToPay}
                    disabled={!canPay || paying || !paymentMode}
                    className="w-full rounded-xl py-3 text-sm font-black text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[11rem]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {paying ? `Opening ${providerLabel}…` : 'Proceed'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DirectPortalCheckoutPage
