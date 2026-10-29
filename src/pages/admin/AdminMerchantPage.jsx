import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AdminHeading, AdminPanel, Avatar, StatCard, StatusPill, TableCell, TableHead, formatMoney } from '../../components/admin/adminUi'
import { adminFetch } from '../../utils/adminApi'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(String(value).length > 10 ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#0b1020]">{value || '—'}</p>
    </div>
  )
}

function Empty({ children }) {
  return <p className="px-4 py-6 text-sm text-slate-500">{children}</p>
}

function portalLabel(key) {
  const labels = {
    airbnb: 'Airbnb',
    booking_com: 'Booking.com',
    direct: 'Direct',
    direct_website: 'Direct website',
    expedia: 'Expedia',
    tripadvisor: 'Tripadvisor',
    vrbo: 'Vrbo',
  }
  return labels[key] || String(key || 'Portal').replace(/_/g, ' ')
}

function AdminMerchantPage() {
  const { merchantId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    adminFetch(`/v1/admin/merchants/${merchantId}`)
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load this merchant.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [merchantId])

  const merchant = data?.merchant
  const counts = data?.counts
  const billing = data?.billing
  const modules = (billing?.items ?? []).filter((item) => item.type === 'addon' && Number(item.amount) > 0)
  const roomsLine = billing?.items?.find((item) => item.type === 'rooms')

  return (
    <>
      <AdminHeading
        kicker="Merchant"
        title={merchant?.name || (loading ? 'Loading merchant' : 'Merchant')}
        description={merchant ? `${merchant.contactName} · Registered ${formatDate(merchant.registeredOn)}` : 'Account, inventory, reservations, and billing.'}
      >
        {merchant ? <StatusPill status={merchant.accountStatus} /> : null}
      </AdminHeading>
      {error ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Rooms" value={loading ? '—' : counts?.rooms ?? 0} hint={`${counts?.activeRooms ?? 0} active`} />
        <StatCard label="Bookings" value={loading ? '—' : counts?.bookings ?? 0} hint={`${counts?.guests ?? 0} ${counts?.guests === 1 ? 'guest' : 'guests'}`} />
        <StatCard label="Revenue" value={loading ? '—' : formatMoney(counts?.revenue, billing?.currency || 'PHP')} hint="Excludes cancelled stays" />
        <StatCard label="Amount due" value={loading ? '—' : billing ? formatMoney(billing.total, billing.currency) : '—'} hint={billing ? `Due ${formatDate(billing.dueOn)}` : 'No bill yet'} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminPanel className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={merchant?.name} />
            <div>
              <p className="text-sm font-semibold text-[#0b1020]">Account</p>
              <p className="text-xs text-slate-500">{merchant?.emailVerified ? 'Email verified' : 'Email not verified'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact" value={merchant?.contactName} />
            <Field label="Email" value={merchant?.email} />
            <Field label="Phone" value={merchant?.contactNumber} />
            <Field label="Registered" value={formatDate(merchant?.registeredOn)} />
            <div className="sm:col-span-2">
              <Field label="Address" value={merchant?.address} />
            </div>
          </div>
        </AdminPanel>

        <AdminPanel className="p-5">
          <p className="text-sm font-semibold text-[#0b1020]">Billing</p>
          {!billing && !loading ? <p className="mt-3 text-sm text-slate-500">No bill is available for this merchant yet.</p> : null}
          {billing ? (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Due date</span>
                <span className="font-semibold text-[#0b1020]">{formatDate(billing.dueOn)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">
                  Rooms{roomsLine ? ` · ${roomsLine.quantity} × ${formatMoney(roomsLine.unitPrice, billing.currency)}` : ''}
                </span>
                <span className="font-semibold text-[#0b1020]">{formatMoney(billing.roomsSubtotal, billing.currency)}</span>
              </div>
              {modules.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 pl-3 text-xs text-slate-500">
                  <span>{item.label}</span>
                  <span>{formatMoney(item.amount, billing.currency)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Modules · {modules.length}</span>
                <span className="font-semibold text-[#0b1020]">{formatMoney(billing.modulesSubtotal, billing.currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[#f1ece4] pt-2">
                <span className="font-semibold text-[#0b1020]">Amount due</span>
                <span className="font-semibold text-[#0b1020]">{formatMoney(billing.total, billing.currency)}</span>
              </div>
            </div>
          ) : null}
        </AdminPanel>
      </div>

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-[#0b1020]">Properties</h2>
        <AdminPanel>
          {(data?.properties ?? []).length === 0 && !loading ? <Empty>No properties yet.</Empty> : null}
          {(data?.properties ?? []).length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[#f1ece4]">
                <tr>
                  <TableHead>Property</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Hours</TableHead>
                </tr>
              </thead>
              <tbody>
                {data.properties.map((property) => (
                  <tr key={property.id} className="border-b border-[#f6f3ee] last:border-0">
                    <TableCell>
                      <p className="font-semibold text-[#0b1020]">{property.name}</p>
                      <p className="text-xs text-slate-500">{property.address || 'No address'}</p>
                    </TableCell>
                    <TableCell>{property.email || '—'}</TableCell>
                    <TableCell>{property.phone || '—'}</TableCell>
                    <TableCell>{property.checkIn || '—'} – {property.checkOut || '—'}</TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : null}
        </AdminPanel>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-[#0b1020]">Rooms</h2>
        <AdminPanel>
          {(data?.rooms ?? []).length === 0 && !loading ? <Empty>No rooms yet.</Empty> : null}
          {(data?.rooms ?? []).length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-[#f1ece4]">
                <tr>
                  <TableHead>Room</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Nightly</TableHead>
                  <TableHead>Status</TableHead>
                </tr>
              </thead>
              <tbody>
                {data.rooms.map((room) => (
                  <tr key={room.id} className="border-b border-[#f6f3ee] last:border-0">
                    <TableCell className="font-semibold text-[#0b1020]">{room.name}</TableCell>
                    <TableCell>{room.property || '—'}</TableCell>
                    <TableCell>{room.type || '—'}</TableCell>
                    <TableCell>{room.maxGuests ?? '—'}</TableCell>
                    <TableCell>{formatMoney(room.pricePerNight, room.currency || 'PHP')}</TableCell>
                    <TableCell><StatusPill status={room.status} /></TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : null}
        </AdminPanel>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-[#0b1020]">Bookings</h2>
        <AdminPanel>
          {(data?.bookings ?? []).length === 0 && !loading ? <Empty>No bookings yet.</Empty> : null}
          {(data?.bookings ?? []).length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-[#f1ece4]">
                <tr>
                  <TableHead>Reference</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Stay</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-[#f6f3ee] last:border-0">
                    <TableCell className="whitespace-nowrap font-semibold text-[#0b1020]">{booking.reference || '—'}</TableCell>
                    <TableCell>
                      <p>{booking.guest || '—'}</p>
                      <p className="text-xs text-slate-500">{booking.email || booking.phone || ''}</p>
                    </TableCell>
                    <TableCell>{booking.room || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}</TableCell>
                    <TableCell>{formatMoney(booking.total, booking.currency || 'PHP')}</TableCell>
                    <TableCell><StatusPill status={booking.status} /></TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : null}
        </AdminPanel>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-[#0b1020]">Payment history</h2>
          <AdminPanel>
            {(data?.payments ?? []).length === 0 && !loading ? <Empty>No payments yet.</Empty> : null}
            {(data?.payments ?? []).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 border-b border-[#f6f3ee] px-4 py-3 text-sm last:border-0">
                <span>
                  <span className="block font-semibold text-[#0b1020]">{formatDate(payment.dueOn)}</span>
                  <span className="text-xs text-slate-500">Paid {formatDateTime(payment.paidAt)}</span>
                </span>
                <span className="font-semibold text-[#0b1020]">{formatMoney(payment.amount, payment.currency)}</span>
              </div>
            ))}
          </AdminPanel>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold text-[#0b1020]">Team and portals</h2>
          <AdminPanel>
            {(data?.team ?? []).length === 0 && (data?.portals ?? []).length === 0 && !loading ? <Empty>No team members or connected portals.</Empty> : null}
            {(data?.team ?? []).map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 border-b border-[#f6f3ee] px-4 py-3 text-sm last:border-0">
                <span>
                  <span className="block font-semibold text-[#0b1020]">{member.name}</span>
                  <span className="text-xs text-slate-500">{member.email}</span>
                </span>
                <StatusPill status={member.role} />
              </div>
            ))}
            {(data?.portals ?? []).map((portal) => (
              <div key={portal.id} className="flex items-center justify-between gap-3 border-b border-[#f6f3ee] px-4 py-3 text-sm last:border-0">
                <span>
                  <span className="block font-semibold text-[#0b1020]">{portalLabel(portal.key)}</span>
                  <span className="text-xs text-slate-500">{portal.listings} listings</span>
                </span>
                <StatusPill status={portal.connected ? 'active' : 'inactive'} />
              </div>
            ))}
          </AdminPanel>
        </section>
      </div>
    </>
  )
}

export default AdminMerchantPage
