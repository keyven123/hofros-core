import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../utils/api'

function DirectPortalPaymentReturnPage() {
  const { merchantSlug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const ref = searchParams.get('ref') || ''
  const cancelled = searchParams.get('cancelled') === '1'

  const [status, setStatus] = useState('loading')
  const [checkout, setCheckout] = useState(null)
  const [error, setError] = useState('')

  const portalPath = `/${merchantSlug}/directportal`
  const title = useMemo(() => {
    if (!merchantSlug) return 'Host'
    return merchantSlug
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }, [merchantSlug])

  useEffect(() => {
    let cancelledEffect = false

    async function run() {
      if (!ref) {
        setStatus('error')
        setError('Missing payment reference.')
        return
      }

      try {
        const data = await apiFetch(`/v1/public/direct-portals/${encodeURIComponent(merchantSlug)}/payments/confirm`, {
          method: 'POST',
          body: JSON.stringify({ ref, cancelled }),
        })
        if (cancelledEffect) return
        setCheckout(data)
        if (cancelled || data?.status === 'cancelled') {
          setStatus('cancelled')
        } else if (data?.status === 'paid') {
          setStatus('paid')
        } else {
          setStatus('pending')
        }
      } catch (requestError) {
        if (cancelledEffect) return
        setStatus('error')
        setError(requestError?.message || 'Could not confirm payment.')
      }
    }

    void run()
    return () => {
      cancelledEffect = true
    }
  }, [merchantSlug, ref, cancelled])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200/90 px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-slate-900/10">
        {status === 'loading' ? (
          <>
            <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-slate-200" />
            <h1 className="mt-5 text-xl font-black text-slate-900">Confirming payment…</h1>
            <p className="mt-2 text-sm text-slate-600">Please wait while we verify your payment with the host’s gateway.</p>
          </>
        ) : null}

        {status === 'paid' ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">✓</div>
            <h1 className="mt-5 text-xl font-black text-slate-900">
              {checkout?.paymentMode === 'reservation' ? 'Reservation paid' : 'Payment successful'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {checkout?.paymentMode === 'reservation'
                ? `Your 50% reservation payment via ${checkout?.providerLabel || 'the payment gateway'} is confirmed`
                : `Your booking payment via ${checkout?.providerLabel || 'the payment gateway'} is confirmed`}
              {checkout?.reference ? (
                <>
                  {' '}
                  (ref <span className="font-mono font-semibold text-slate-800">{checkout.reference}</span>)
                </>
              ) : null}
              .
              {checkout?.paymentMode === 'reservation'
                ? ` Remaining balance may be settled with ${title} before or during your stay.`
                : ` ${title} will follow up with stay details.`}
            </p>
          </>
        ) : null}

        {status === 'cancelled' ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl text-white">!</div>
            <h1 className="mt-5 text-xl font-black text-slate-900">Payment cancelled</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You cancelled the checkout. Your booking request may still be on file — contact {title} if you want to pay
              another way.
            </p>
          </>
        ) : null}

        {status === 'pending' ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-2xl text-white">…</div>
            <h1 className="mt-5 text-xl font-black text-slate-900">Payment pending</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              We have not received a paid confirmation yet. If you already paid, refresh this page in a moment or contact{' '}
              {title}.
            </p>
          </>
        ) : null}

        {status === 'error' ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-2xl text-white">×</div>
            <h1 className="mt-5 text-xl font-black text-slate-900">Could not confirm payment</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{error}</p>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => navigate(portalPath)}
          className="mt-8 w-full rounded-xl bg-[#0f3f73] py-3 text-sm font-black text-white shadow-md transition hover:opacity-95"
        >
          Back to {title}
        </button>
      </div>
    </div>
  )
}

export default DirectPortalPaymentReturnPage
