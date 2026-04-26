import { Outlet, useLocation } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'

function AppLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-[#f4f9ff] text-slate-800">
      <Navbar />
      <main className={isHome ? 'w-full' : 'mx-auto w-full max-w-6xl px-6 py-12'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default AppLayout
