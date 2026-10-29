import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearMarketingSession, getMarketingSession } from '../utils/auth'

function MarketingLayout() {
  const navigate = useNavigate()
  const session = getMarketingSession()

  function logout() {
    clearMarketingSession()
    navigate('/marketing/login', { replace: true })
  }

  const linkClass = ({ isActive }) =>
    `block rounded-xl px-3 py-2 text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`

  return (
    <div className="flex h-dvh min-h-0 bg-[#f6f3ee]">
      <aside className="flex w-[220px] shrink-0 flex-col bg-[#0b1020] text-white">
        <div className="px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e8c872]">Hofros</p>
          <p className="mt-1 text-sm font-semibold">Marketing</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          <NavLink to="/marketing" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/marketing/targets" className={linkClass}>Targets</NavLink>
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-xs font-semibold">{session?.name || session?.email || 'Marketing'}</p>
          <button type="button" onClick={logout} className="mt-2 text-xs font-semibold text-white/60">Logout</button>
        </div>
      </aside>
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MarketingLayout
