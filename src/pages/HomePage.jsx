import { Link } from 'react-router-dom'

const metrics = [
  { value: '12,000+', label: 'Active Hosts' },
  { value: '48,000+', label: 'Properties Managed' },
  { value: '₱120M+', label: 'Revenue Generated' },
  { value: '38', label: 'Countries' },
]

const features = [
  {
    icon: 'calendar',
    tone: 'blue',
    title: 'Smart Booking Management',
    description:
      'Manage all your reservations in one place with real-time availability and automated confirmations.',
  },
  {
    icon: 'globe',
    tone: 'amber',
    title: 'Multi-Channel Sync',
    description:
      'Connect Airbnb, Booking.com, Expedia and more in one calendar, with zero double bookings.',
  },
  {
    icon: 'message',
    tone: 'blue',
    title: 'Guest Messaging',
    description: 'Chat with guests across all platforms from a single unified inbox.',
  },
  {
    icon: 'chart',
    tone: 'amber',
    title: 'Revenue Analytics',
    description: 'Track occupancy, revenue, and performance with beautiful, actionable reports.',
  },
  {
    icon: 'bolt',
    tone: 'blue',
    title: 'Automations',
    description: 'Automate check-in messages, price updates, and cleaning schedules effortlessly.',
  },
  {
    icon: 'star',
    tone: 'amber',
    title: 'Guest Experiences',
    description: 'Offer curated local experiences to delight guests and boost your income.',
  },
]

const testimonials = [
  {
    quote: '"hofros saved me 10+ hours a week. The multi-channel sync is a game changer!"',
    name: 'Maria Santos',
    role: 'Host - 4 properties',
  },
  {
    quote: '"Finally, a platform that feels built for real hosts. The analytics alone are worth it."',
    name: 'Carlos Rivera',
    role: 'Property Manager - 12 units',
  },
  {
    quote: '"My occupancy went from 68% to 89% in just 3 months. Highly recommended!"',
    name: 'Ana Reyes',
    role: 'Villa Owner - 2 properties',
  },
]

function FeatureIcon({ type, tone }) {
  const boxTone =
    tone === 'amber'
      ? 'bg-[#fff7df] text-[#b45309] ring-1 ring-amber-200/60'
      : 'bg-[#eff7ff] text-[#0c4a84] ring-1 ring-blue-200/60'

  const common = 'h-5 w-5 stroke-[1.9]'

  if (type === 'calendar') {
    return (
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${boxTone}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={common}
          aria-hidden="true"
        >
          <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5H20.5" />
          <path d="M8 3.5V7" />
          <path d="M16 3.5V7" />
        </svg>
      </div>
    )
  }

  if (type === 'globe') {
    return (
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${boxTone}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={common}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12H20.5" />
          <path d="M12 3.5C14.2 5.7 15.4 8.8 15.4 12C15.4 15.2 14.2 18.3 12 20.5" />
          <path d="M12 3.5C9.8 5.7 8.6 8.8 8.6 12C8.6 15.2 9.8 18.3 12 20.5" />
        </svg>
      </div>
    )
  }

  if (type === 'message') {
    return (
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${boxTone}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={common}
          aria-hidden="true"
        >
          <path d="M6 5.5H18C19.4 5.5 20.5 6.6 20.5 8V15C20.5 16.4 19.4 17.5 18 17.5H10.5L6 20.5V17.5C4.6 17.5 3.5 16.4 3.5 15V8C3.5 6.6 4.6 5.5 6 5.5Z" />
        </svg>
      </div>
    )
  }

  if (type === 'chart') {
    return (
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${boxTone}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={common}
          aria-hidden="true"
        >
          <path d="M4 19.5H20" />
          <path d="M7 16V10" />
          <path d="M12 16V6.5" />
          <path d="M17 16V12.5" />
        </svg>
      </div>
    )
  }

  if (type === 'bolt') {
    return (
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${boxTone}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={common}
          aria-hidden="true"
        >
          <path d="M13.2 3.5L5.5 12.2H11L10.2 20.5L17.8 11.8H12.3L13.2 3.5Z" />
        </svg>
      </div>
    )
  }

  return (
    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${boxTone}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={common}
        aria-hidden="true"
      >
        <path d="M12 4.2L14.3 9L19.6 9.7L15.7 13.3L16.7 18.7L12 16.1L7.3 18.7L8.3 13.3L4.4 9.7L9.7 9L12 4.2Z" />
      </svg>
    </div>
  )
}

function HomePage() {
  return (
    <section className="overflow-hidden">
      <div className="hero-bg relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 md:grid-cols-2 md:px-6 md:pt-20">
          <div className="text-left">
            <p className="fade-up inline-flex items-center rounded-full border border-amber-200 bg-amber-100/70 px-4 py-2 text-xs font-semibold tracking-wide text-[#b45309]">
              The all-in-one hotel management platform
            </p>

            <h1 className="fade-up mt-6 text-4xl font-black leading-tight tracking-tight text-[#0e3f72] md:text-6xl">
              Manage Your Properties
              <span className="block text-[#f59e0b]">Smarter &amp; Simpler</span>
            </h1>

            <p className="fade-up mt-5 max-w-xl text-base text-slate-500 md:text-lg">
              hofros brings all your bookings, channels, guests, and revenue into one beautiful
              dashboard. Save hours every week and grow your property business.
            </p>

            <div className="fade-up mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-3 text-sm font-bold text-[#0f3f72] shadow-[0_16px_30px_rgba(245,158,11,0.33)] transition hover:-translate-y-0.5"
              >
                Start for Free
              </Link>
              <button
                type="button"
                className="rounded-xl border-2 border-[#114779] bg-white px-6 py-3 text-sm font-bold text-[#114779] shadow-sm transition hover:bg-[#eef6ff]"
              >
                View Demo
              </button>
            </div>
          </div>

          <div className="fade-up relative">
            <div className="float-card rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_30px_60px_rgba(15,23,42,0.15)] md:p-5">
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-[#f8fbff]">
                <div className="h-44 bg-gradient-to-br from-[#dbeafe] via-[#bfdbfe] to-[#93c5fd] p-4">
                  <div className="h-full rounded-xl border border-white/40 bg-gradient-to-r from-[#1d4ed8]/80 to-[#0f766e]/70 p-4 text-white shadow-inner">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Hotel Reservation</p>
                    <p className="mt-2 text-2xl font-black">Ocean View Suite</p>
                    <p className="mt-1 text-sm text-blue-100">2 Guests · 3 Nights · Apr 26-29</p>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#0f3f73]">Reservation #HFR-4821</p>
                      <p className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                        Confirmed
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Guest: Emily Watson · Check-in 14:00</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <article className="rounded-lg bg-[#eff7ff] p-3 text-center">
                      <p className="text-xs text-slate-400">Bookings</p>
                      <p className="text-lg font-extrabold text-[#0c4a84]">34</p>
                    </article>
                    <article className="rounded-lg bg-[#fff7df] p-3 text-center">
                      <p className="text-xs text-slate-400">Revenue</p>
                      <p className="text-lg font-extrabold text-[#0c4a84]">₱12.4k</p>
                    </article>
                    <article className="rounded-lg bg-[#eff7ff] p-3 text-center">
                      <p className="text-xs text-slate-400">Occupancy</p>
                      <p className="text-lg font-extrabold text-[#0c4a84]">87%</p>
                    </article>
                  </div>
                </div>
              </div>
            </div>

            <div className="pulse-soft absolute -right-5 -top-6 rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-lg">
              <p className="text-xs text-slate-400">Today Check-ins</p>
              <p className="text-xl font-black text-[#0f3f73]">14 Guests</p>
            </div>

            <div className="float-card-slow absolute -bottom-5 -left-6 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-lg">
              <p className="text-xs text-slate-400">Auto Messages Sent</p>
              <p className="text-xl font-black text-[#0f3f73]">96%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0c4a84] py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 text-center md:grid-cols-4 md:px-6">
          {metrics.map((item) => (
            <article key={item.label} className="fade-up">
              <p className="text-4xl font-black tracking-tight text-white">{item.value}</p>
              <p className="mt-2 text-sm font-medium text-blue-100">{item.label}</p>
            </article>
          ))}
        </div>
      </div>

      <div id="features" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
          Everything You Need
        </p>
        <h2 className="mt-3 text-center text-4xl font-black tracking-tight text-[#0d3f71]">
          Built for Property Hosts
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-slate-500">
          All the tools you need to manage, grow, and delight guests in one place.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="fade-up rounded-2xl border border-[#e8f1fb] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <FeatureIcon type={feature.icon} tone={feature.tone} />
              <h3 className="mt-4 text-lg font-extrabold text-[#0f3f73]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div id="reviews" className="bg-[#fff8e8] py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
            Loved By Hosts
          </p>
          <h2 className="mt-3 text-center text-4xl font-black tracking-tight text-[#0d3f71]">
            What Our Hosts Say
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <article
                key={item.name}
                className="fade-up rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-100"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-sm leading-6 text-slate-600">{item.quote}</p>
                <div className="mt-5">
                  <p className="font-bold text-[#0f3f73]">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div id="pricing" className="bg-[#fff7df] px-4 py-16 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-black tracking-tight text-[#0d3f71]">
            Ready to Grow Your Property?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Join 12,000+ hosts who trust hofros to manage their properties.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-8 py-4 text-sm font-black text-[#0f3f72] shadow-[0_16px_28px_rgba(245,158,11,0.35)] transition hover:-translate-y-0.5"
          >
            Start Free - No Credit Card Needed
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomePage
