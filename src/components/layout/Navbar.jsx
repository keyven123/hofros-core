import { Link, useLocation } from 'react-router-dom'
import LogoMark from '../common/LogoMark'

const links = [
  { label: 'Features', to: '/#features' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'Reviews', to: '/#reviews' },
]

function Navbar() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="Hofros home">
          <LogoMark size="sm" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.to}
              href={link.to}
              className="text-sm font-medium text-slate-500 transition hover:text-[#103f6f]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            to="/login"
            className="rounded-full px-3 py-2 text-sm font-semibold text-[#103f6f] transition hover:bg-[#f1f6ff]"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2 text-sm font-semibold text-[#103f6f] shadow-[0_10px_22px_rgba(245,158,11,0.32)] transition hover:scale-[1.02] hover:shadow-[0_14px_28px_rgba(245,158,11,0.4)]"
          >
            Get Started Free
          </Link>
        </div>
      </div>

      {!isHome && (
        <div className="border-t border-slate-100 bg-[#f8fbff] px-4 py-2 text-center text-sm text-slate-600">
          <a href="/" className="font-medium text-[#0c4a84] hover:underline">
            Back to Homepage
          </a>
        </div>
      )}
    </header>
  )
}

export default Navbar
