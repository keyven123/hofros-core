import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../utils/api'

const FALLBACK_BANDS = [
  { maxRooms: 1, pricePerRoom: 999 },
  { maxRooms: 2, pricePerRoom: 950 },
  { maxRooms: 3, pricePerRoom: 900 },
  { maxRooms: 4, pricePerRoom: 850 },
  { maxRooms: 5, pricePerRoom: 800 },
  { maxRooms: 6, pricePerRoom: 775 },
  { maxRooms: 7, pricePerRoom: 750 },
  { maxRooms: 8, pricePerRoom: 725 },
  { maxRooms: 9, pricePerRoom: 700 },
  { maxRooms: 10, pricePerRoom: 675 },
  { maxRooms: 11, pricePerRoom: 650 },
  { maxRooms: 12, pricePerRoom: 625 },
  { maxRooms: 13, pricePerRoom: 600 },
  { maxRooms: 14, pricePerRoom: 575 },
  { maxRooms: 15, pricePerRoom: 550 },
  { maxRooms: 16, pricePerRoom: 540 },
  { maxRooms: 17, pricePerRoom: 530 },
  { maxRooms: 18, pricePerRoom: 520 },
  { maxRooms: 19, pricePerRoom: 510 },
]

const FALLBACK_UNCAPPED = { maxRooms: null, pricePerRoom: 499, name: 'No room cap' }

const FALLBACK_CYCLES = [
  { id: 'monthly', label: 'Monthly', months: 1, discountPercent: 0 },
  { id: 'yearly', label: 'Yearly', months: 12, discountPercent: 66 },
  { id: 'two_year', label: '2-Year', months: 24, discountPercent: 70 },
]

const CURRENCIES = [
  { id: 'PHP', label: 'PHP', symbol: '₱', rate: 1 },
  { id: 'USD', label: 'USD', symbol: '$', rate: 1 / 58 },
  { id: 'EUR', label: 'EUR', symbol: '€', rate: 1 / 63 },
]

function formatMoney(amount, currency) {
  const value = Math.max(0, Number(amount) || 0)
  const digits = currency.id === 'PHP' ? (value >= 1000 ? 0 : 0) : 2
  return `${currency.symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

function bandForUnits(bands, units) {
  const capped = [...bands]
    .filter((band) => band.maxRooms != null)
    .sort((a, b) => a.maxRooms - b.maxRooms)
  return capped.find((band) => units <= band.maxRooms) ?? null
}

function PricingSection() {
  const [bands, setBands] = useState(FALLBACK_BANDS)
  const [uncapped, setUncapped] = useState(FALLBACK_UNCAPPED)
  const [cycles, setCycles] = useState(FALLBACK_CYCLES)
  const [units, setUnits] = useState(1)
  const [cycleId, setCycleId] = useState('yearly')
  const [currencyId, setCurrencyId] = useState('PHP')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiFetch('/v1/public/pricing')
        if (cancelled) return
        if (Array.isArray(data?.bands) && data.bands.length > 0) {
          setBands(data.bands)
        }
        if (data?.uncapped) {
          setUncapped(data.uncapped)
        }
        if (Array.isArray(data?.billingCycles) && data.billingCycles.length > 0) {
          setCycles(data.billingCycles)
        }
      } catch {
        // Keep catalog fallbacks so the homepage still shows pricing offline.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const currency = CURRENCIES.find((row) => row.id === currencyId) ?? CURRENCIES[0]
  const cycle = cycles.find((row) => row.id === cycleId) ?? cycles[0]
  const selectedBand = bandForUnits(bands, units) ?? uncapped
  const usingUncapped = !bandForUnits(bands, units) && Boolean(uncapped)

  const pricePerRoomPhp = Number(selectedBand?.pricePerRoom ?? 0)
  const listMonthlyPhp = pricePerRoomPhp * units
  const discount = Number(cycle?.discountPercent ?? 0) / 100
  const effectiveMonthlyPhp = listMonthlyPhp * (1 - discount)
  const billedTotalPhp = effectiveMonthlyPhp * Number(cycle?.months ?? 1)

  const listMonthly = listMonthlyPhp * currency.rate
  const effectiveMonthly = effectiveMonthlyPhp * currency.rate
  const billedTotal = billedTotalPhp * currency.rate
  const perRoomEffective = (pricePerRoomPhp * (1 - discount)) * currency.rate

  function bumpUnits(delta) {
    setUnits((current) => {
      const next = current + delta
      if (next < 1) return 1
      if (next > 50) return 50
      return next
    })
  }

  const cards = [
    {
      id: 'flex',
      name: 'Host Flex',
      badge: null,
      popular: false,
      discountLabel: null,
      listPrice: listMonthly,
      price: listMonthly,
      feeLabel: 'Modules billed separately',
      note: 'Pay month to month. Price follows your active room count.',
      cta: 'Start now',
      ctaTo: '/register',
      ctaTone: 'outline',
      blurb: 'Best if you want to start quickly and adjust rooms as you grow.',
    },
    {
      id: 'prepaid',
      name: 'Host Prepaid',
      badge: 'Most popular',
      popular: true,
      discountLabel: discount > 0 ? `-${Math.round(discount * 100)}%` : null,
      listPrice: listMonthly,
      price: effectiveMonthly,
      feeLabel: '0% platform booking fee',
      note: 'Price based on number of units selected',
      cta: 'Start now',
      ctaTo: '/register',
      ctaTone: 'primary',
      blurb:
        cycleId === 'monthly'
          ? 'Same room baseline as Flex, with a clearer prepaid path when you choose Yearly or 2-Year.'
          : `Lock in ${cycle.label.toLowerCase()} billing and keep the lower effective monthly rate.`,
    },
    {
      id: 'scale',
      name: 'Teams Scale',
      badge: null,
      popular: false,
      discountLabel: discount > 0 ? `-${Math.round(discount * 100)}%` : null,
      listPrice: Number(uncapped?.pricePerRoom ?? pricePerRoomPhp) * units * currency.rate,
      price:
        Number(uncapped?.pricePerRoom ?? pricePerRoomPhp) * units * (1 - discount) * currency.rate,
      feeLabel: 'No room cap available',
      note: `Uncapped baseline · ${formatMoney((uncapped?.pricePerRoom ?? 0) * currency.rate, currency)} / room`,
      cta: 'Contact us',
      ctaTo: '/contact',
      ctaTone: 'dark',
      blurb: 'For larger portfolios that want the uncapped room baseline from admin subscriptions.',
    },
  ]

  return (
    <section id="pricing" className="bg-[#f7fbff] px-4 py-20 md:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
          Simple Pricing
        </p>
        <h2 className="mt-3 text-center text-4xl font-black tracking-tight text-[#0d3f71]">
          Plans that grow with your rooms
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-500">
          Rates come from the same subscription baselines in admin. Choose your units and billing
          cycle to see your monthly amount.
        </p>

        <div className="mt-10 rounded-3xl border border-[#dbe7f5] bg-white p-5 shadow-sm md:p-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Step 1
              </p>
              <p className="mt-1 text-sm font-extrabold text-[#0f3f73]">How many units?</p>
              <div className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => bumpUnits(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold text-[#0f3f73] hover:bg-slate-50"
                  aria-label="Decrease units"
                >
                  −
                </button>
                <span className="min-w-12 text-center text-xl font-black text-[#0f3f73]">{units}</span>
                <button
                  type="button"
                  onClick={() => bumpUnits(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold text-[#0f3f73] hover:bg-slate-50"
                  aria-label="Increase units"
                >
                  +
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {usingUncapped
                  ? 'Above 19 rooms uses the uncapped baseline.'
                  : `Matched to “${selectedBand?.name ?? `Up to ${units} rooms`}”.`}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-4 lg:col-span-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Step 2
              </p>
              <p className="mt-1 text-sm font-extrabold text-[#0f3f73]">Select your plan</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {cycles.map((row) => {
                  const active = row.id === cycleId
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setCycleId(row.id)}
                      className={`relative rounded-full px-4 py-2 text-sm font-bold transition ${
                        active
                          ? 'bg-[#0c4a84] text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200'
                      }`}
                    >
                      {row.label}
                      {row.discountPercent > 0 ? (
                        <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
                          -{row.discountPercent}%
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-[#f8fbff] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Step 3
              </p>
              <p className="mt-1 text-sm font-extrabold text-[#0f3f73]">Select your currency</p>
              <label className="mt-4 block">
                <span className="sr-only">Currency</span>
                <select
                  value={currencyId}
                  onChange={(event) => setCurrencyId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-[#0f3f73] outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {CURRENCIES.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-3 text-xs text-slate-500">
                Admin rates are stored in PHP. Other currencies are display estimates.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-100 bg-[#fff8e8] px-4 py-3 text-sm text-[#0f3f73]">
            <span className="font-black">{units}</span> {units === 1 ? 'unit' : 'units'} ·{' '}
            <span className="font-black">{formatMoney(perRoomEffective, currency)}</span> / room
            effective ·{' '}
            <span className="font-black">{formatMoney(effectiveMonthly, currency)}</span> / month
            {cycle?.months > 1 ? (
              <>
                {' '}
                · billed {formatMoney(billedTotal, currency)} every {cycle.months} months
              </>
            ) : null}
            {loading ? <span className="ml-2 text-xs text-slate-500">Updating from admin…</span> : null}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.id}
              className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${
                card.popular
                  ? 'border-amber-300 ring-2 ring-amber-200'
                  : 'border-[#e8f1fb]'
              }`}
            >
              {card.badge ? (
                <span className="absolute -top-3 left-6 rounded-full bg-[#0c4a84] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                  {card.badge}
                </span>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-black text-[#0f3f73]">{card.name}</h3>
                {card.discountLabel ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                    {card.discountLabel}
                  </span>
                ) : null}
              </div>

              <div className="mt-5">
                {card.discountLabel && card.listPrice > card.price ? (
                  <p className="text-sm font-semibold text-slate-400 line-through">
                    {formatMoney(card.listPrice, currency)}/month
                  </p>
                ) : (
                  <div className="h-5" />
                )}
                <p className="mt-1 text-4xl font-black tracking-tight text-[#0d3f71]">
                  {formatMoney(card.price, currency)}
                  <span className="text-base font-bold text-slate-500"> /month</span>
                </p>
              </div>

              <p className="mt-3 text-sm font-semibold text-[#0c4a84]">{card.feeLabel}</p>
              <p className="mt-1 text-xs text-slate-500">{card.note}</p>

              <Link
                to={card.ctaTo}
                className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-black transition ${
                  card.ctaTone === 'primary'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-[#0f3f72] shadow-[0_12px_24px_rgba(245,158,11,0.35)] hover:-translate-y-0.5'
                    : card.ctaTone === 'dark'
                      ? 'bg-[#0c4a84] text-white hover:bg-[#0a3f71]'
                      : 'border border-slate-300 bg-white text-[#0f3f73] hover:bg-slate-50'
                }`}
              >
                {card.cta}
              </Link>

              <div className="mt-5 rounded-2xl bg-[#eef6ff] p-4 text-sm leading-6 text-slate-600">
                {card.blurb}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingSection
