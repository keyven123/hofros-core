import { useEffect, useState } from 'react'
import { AdminHeading, AdminPanel } from '../../components/admin/adminUi'
import { adminFetch } from '../../utils/adminApi'

function AdminSettingsPage() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    adminFetch('/v1/admin/me')
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load settings.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const fields = [
    ['Name', user?.name],
    ['Email', user?.email],
    ['Role', user?.role],
    ['Account', user?.merchantName],
    ['Phone', user?.contactNumber],
    ['Console', 'Hofros admin'],
  ]

  return (
    <>
      <AdminHeading kicker="Access" title="Settings" description="The administrator signed in to the platform console." />
      {error ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <AdminPanel className="bg-[#0b1020] p-6 text-white">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f3e2b3] to-[#c6a15b] text-lg font-black text-[#1a1408]">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e8c872]">Signed in</p>
          <p className="mt-2 text-xl font-semibold">{user?.name || 'Administrator'}</p>
          <p className="mt-1 text-sm text-white/60">{user?.email || 'Loading account…'}</p>
        </AdminPanel>
        <AdminPanel className="p-6">
          {user ? (
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {fields.map(([label, value]) => (
                <div key={label} className="border-b border-[#f1ece4] pb-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-[#0b1020]">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-500">{error ? '' : 'Loading account…'}</p>
          )}
        </AdminPanel>
      </div>
    </>
  )
}

export default AdminSettingsPage
