import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import LogoMark from '../components/common/LogoMark'
import MerchantSideNav from '../components/merchant/MerchantSideNav'
import { clearMerchantSession, getMerchantSession } from '../utils/auth'

const TOP_BAR_H = 'h-14'
const BORDER = 'border-[#e0e0e0]'

function MerchantLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const session = getMerchantSession()
  const merchantName = session?.merchantName?.trim() || 'Merchant'
  const merchantInitial = merchantName.charAt(0).toLocaleUpperCase()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)

  const isBookingsListRoute = location.pathname === '/bookings'
  const isBookingsSection =
    isBookingsListRoute || location.pathname.startsWith('/bookings/')
  const headerSearchValue = isBookingsListRoute ? (searchParams.get('q') ?? '') : undefined
  const [draftSearch, setDraftSearch] = useState('')

  useEffect(() => {
    if (!isBookingsSection) {
      setDraftSearch('')
    }
  }, [isBookingsSection, location.pathname])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  function handleLogout() {
    clearMerchantSession()
    navigate('/login', { replace: true })
    setIsProfileOpen(false)
  }

  return (
    <section className="h-dvh max-h-dvh overflow-hidden bg-[#f6f9ff]">
      <div
        className={`grid h-full min-h-0 w-full grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_minmax(0,2fr)] overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-[3.5rem_minmax(0,1fr)]`}
      >
        <Link
          to="/"
          aria-label="Hofros home"
          className={`box-border flex shrink-0 ${TOP_BAR_H} items-center gap-2 border-b ${BORDER} bg-white px-3 lg:col-start-1 lg:row-start-1 lg:border-r`}
        >
          <LogoMark size="sm" />
        </Link>

        <header
          className={`box-border flex shrink-0 ${TOP_BAR_H} min-w-0 flex-nowrap items-center gap-3 border-b ${BORDER} bg-white px-4 lg:col-start-2 lg:row-start-1`}
        >
          <p
            className="min-w-0 max-w-[min(240px,42vw)] shrink-0 truncate text-sm font-semibold uppercase text-[#0f3f73]"
            title={merchantName}
          >
            {merchantName}
          </p>
          <label
            htmlFor="merchant-search"
            className="flex h-9 min-w-0 max-w-xl flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-[#fbfdff] px-3"
          >
            <span className="shrink-0 text-slate-400">⌕</span>
            <input
              id="merchant-search"
              type="text"
              placeholder="Guest or Reservation ID"
              value={isBookingsListRoute ? headerSearchValue : draftSearch}
              onChange={(e) => {
                const v = e.target.value
                if (isBookingsListRoute) {
                  const next = new URLSearchParams(searchParams)
                  if (v.trim()) {
                    next.set('q', v)
                  } else {
                    next.delete('q')
                  }
                  setSearchParams(next, { replace: true })
                } else {
                  setDraftSearch(v)
                }
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') {
                  return
                }
                if (isBookingsListRoute) {
                  return
                }
                const q = draftSearch.trim()
                if (q) {
                  navigate(`/bookings?q=${encodeURIComponent(q)}`)
                } else {
                  navigate('/bookings')
                }
              }}
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Customize
            </button>
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((previous) => !previous)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-[#eff6ff] text-sm font-bold text-[#0f3f73]"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                {merchantInitial}
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-11 z-30 min-w-[210px] overflow-hidden rounded-lg border border-blue-100 bg-white shadow-[0_16px_34px_rgba(15,23,42,0.14)]">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Merchant</p>
                    <p className="mt-1 text-sm font-bold text-[#0f3f73]">{merchantName}</p>
                  </div>

                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-[#f4f9ff] hover:text-[#0f3f73]"
                  >
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden lg:col-start-1 lg:row-start-2 lg:self-stretch lg:overflow-hidden">
          <MerchantSideNav />
        </div>

        <main className="flex min-h-0 w-full min-w-0 flex-col overflow-y-auto overflow-x-hidden bg-[#f6f9ff] lg:col-start-2 lg:row-start-2">
          <Outlet />
        </main>
      </div>
    </section>
  )
}

export default MerchantLayout
