import { NavLink } from 'react-router-dom'

export const MERCHANT_NAV = [
  { label: 'Home', to: '/dashboard', icon: 'home', end: true },
  { label: 'Calendar', to: '/calendar', icon: 'calendar' },
  { label: 'Bookings', to: '/bookings', icon: 'bookings' },
  { label: 'Discount', to: '/discount', icon: 'discount' },
  { label: 'Messages', to: '/messages', icon: 'messages' },
  { label: 'Analytics', to: '/analytics', icon: 'analytics' },
  { label: 'Booking Portals', to: '/bookingportals', icon: 'portals' },
  { label: 'Marketplace', to: '/marketplace', icon: 'marketplace' },
  { label: 'Experience', to: '/experience', icon: 'experience' },
  { label: 'Configuration', to: '/configuration', icon: 'configuration' },
  { label: 'Advanced', to: '/advance', icon: 'advanced' },
]

function SideMenuIcon({ type }) {
  const common = 'h-[18px] w-[18px] shrink-0 stroke-[1.75] text-current'
  const stroke = { strokeLinecap: 'round', strokeLinejoin: 'round' }

  if (type === 'home') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5.5 9.5V20a1 1 0 0 0 1 1h4v-7h5v7h4a1 1 0 0 0 1-1V9.5" />
      </svg>
    )
  }

  if (type === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    )
  }

  if (type === 'bookings') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    )
  }

  if (type === 'discount') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M20.59 13.41 11 23l-2.29-2.29a1 1 0 0 0-.71-.29H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 .29-.71L12.88 5.12a2 2 0 0 1 2.83 0l4.88 4.88a2 2 0 0 1 0 2.83z" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m9 15 6-6" />
      </svg>
    )
  }

  if (type === 'messages') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  }

  if (type === 'analytics') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    )
  }

  if (type === 'portals') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 3.5c2.8 2.5 4.3 5.8 4.3 8.5s-1.5 6-4.3 8.5" />
        <path d="M12 3.5c-2.8 2.5-4.3 5.8-4.3 8.5s1.5 6 4.3 8.5" />
      </svg>
    )
  }

  if (type === 'marketplace') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M10 12h4" />
        <path d="M6 12v4h12v-4" />
      </svg>
    )
  }

  if (type === 'experience') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72z" />
        <path d="m14 7 3 3" />
        <path d="M5 6v4" />
        <path d="M19 14v4" />
        <path d="M10 2v2" />
        <path d="M7 8l1 1" />
      </svg>
    )
  }

  if (type === 'configuration') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  if (type === 'advanced') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    )
  }

  if (type === 'help') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    )
  }

  return null
}

const navLinkClass = ({ isActive }) =>
  `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
    isActive
      ? 'bg-[#E8F0FE] font-semibold text-[#2B5AED]'
      : 'font-medium text-slate-600 hover:bg-white/80 hover:text-slate-900'
  }`

function MerchantSideNav() {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-[#e0e0e0] bg-[#f8f9fa]">
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {MERCHANT_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
            <span className="inline-flex h-5 w-5 items-center justify-center shrink-0">
              <SideMenuIcon type={item.icon} />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[#e0e0e0] bg-[#f8f9fa] p-2">
        <NavLink to="/help" className={navLinkClass}>
          <span className="inline-flex h-5 w-5 items-center justify-center shrink-0">
            <SideMenuIcon type="help" />
          </span>
          <span>Help</span>
        </NavLink>
      </div>
    </aside>
  )
}

export default MerchantSideNav
