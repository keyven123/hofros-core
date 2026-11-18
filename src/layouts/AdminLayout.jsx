import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearAdminSession, getAdminSession } from '../utils/auth'

const GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: IconDashboard, end: true },
      { to: '/admin/merchants', label: 'Merchants', icon: IconBuilding },
      { to: '/admin/subscriptions', label: 'Subscriptions', icon: IconCard },
      { to: '/admin/marketing', label: 'Marketing', icon: IconTarget },
    ],
  },
  {
    label: 'Reservations',
    items: [
      { to: '/admin/bookings', label: 'Bookings', icon: IconBook },
      { to: '/admin/calendars', label: 'Calendars', icon: IconCalendar },
    ],
  },
  {
    label: 'Access',
    items: [
      { to: '/admin/users', label: 'User management', icon: IconUsers },
      { to: '/admin/integrations', label: 'Partner integrations', icon: IconLink },
      { to: '/admin/settings', label: 'Settings', icon: IconGear },
    ],
  },
]

function AdminLayout() {
  const navigate = useNavigate()
  const session = getAdminSession()
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const initial = (session?.email || 'A').charAt(0).toUpperCase()

  function handleLogout() {
    clearAdminSession()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-[#f6f3ee] font-sans text-[#0b1020]">
      <aside className="flex w-[260px] shrink-0 flex-col bg-[#0b1020] text-sm text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#f3e2b3] to-[#c6a15b] text-sm font-black text-[#1a1408]">
              H
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-wide">Hofros</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e8c872]">Admin console</p>
            </div>
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-4" aria-label="Admin">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{group.label}</p>
              <div className="mt-2 flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition ${
                          isActive
                            ? 'bg-white/10 text-white shadow-[inset_3px_0_0_#e8c872]'
                            : 'text-white/55 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8c872] text-xs font-bold text-[#1a1408]">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{session?.email || 'Administrator'}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Platform admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-white/55 transition hover:bg-white/5 hover:text-white"
          >
            <IconLogout className="h-[18px] w-[18px] shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e8e4dc] bg-[#f6f3ee]/90 px-6 backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Platform administration</p>
          <p className="text-sm text-slate-600">{today}</p>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="box-border w-full px-5 py-6 sm:px-7 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function IconDashboard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconCard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )
}

function IconBuilding(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M4 21V7l8-4 8 4v14M9 21v-6h6v6" />
    </svg>
  )
}

function IconBook(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function IconUsers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconTarget(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function IconGear(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  )
}

function IconLink(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93" />
      <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 0 0 7.07 7.07L14 18.07" />
    </svg>
  )
}

function IconLogout(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

export default AdminLayout
