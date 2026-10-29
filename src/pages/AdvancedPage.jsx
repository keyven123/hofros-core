import { useCallback, useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../utils/api'
import { getApiToken, updateMerchantSession } from '../utils/auth'

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'users', label: 'Users' },
  { id: 'payments', label: 'Payments' },
  { id: 'notifications', label: 'Notifications' },
]

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
]

const EMPTY_PROFILE = {
  merchant_name: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  contact_number: '',
  address: '',
  email: '',
}

const EMPTY_PAYMENT = {
  acceptCash: true,
  acceptGcash: false,
  acceptBankTransfer: false,
  acceptCard: false,
  gcashName: '',
  gcashNumber: '',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  currency: 'PHP',
  depositRequired: false,
  depositPercent: 0,
  instructions: '',
}

const EMPTY_NOTIFICATIONS = {
  newBooking: true,
  cancellation: true,
  checkIn: true,
  checkOut: false,
  payment: true,
  review: false,
}

const NOTIFICATION_FIELDS = [
  { key: 'newBooking', label: 'New booking', hint: 'When a guest or staff member creates a reservation.' },
  { key: 'cancellation', label: 'Cancellation', hint: 'When a stay is cancelled.' },
  { key: 'checkIn', label: 'Check-in', hint: 'On the morning of an arrival.' },
  { key: 'checkOut', label: 'Check-out', hint: 'On the morning of a departure.' },
  { key: 'payment', label: 'Payment', hint: 'When a payment or refund is recorded.' },
  { key: 'review', label: 'Review', hint: 'When a guest leaves feedback.' },
]

function fieldClass() {
  return 'w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2.5 text-sm text-slate-800 outline-none ring-[#2B5AED] focus:ring-2'
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span>
        <span className="block text-sm font-bold text-[#0f3f73]">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-slate-500">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#2B5AED]"
      />
    </label>
  )
}

function AdvancedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSection = searchParams.get('section')
  const section = SECTIONS.some((item) => item.id === requestedSection) ? requestedSection : 'profile'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState('')
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [team, setTeam] = useState([])
  const [invite, setInvite] = useState({ name: '', email: '', role: 'staff' })
  const [payment, setPayment] = useState(EMPTY_PAYMENT)
  const [notifications, setNotifications] = useState(EMPTY_NOTIFICATIONS)

  const load = useCallback(async () => {
    if (!getApiToken()) {
      setError('Sign in again to manage settings.')
      setLoading(false)
      return
    }

    setError('')
    setLoading(true)
    try {
      const [accountData, teamData, paymentData, notificationData] = await Promise.all([
        apiFetch('/v1/account'),
        apiFetch('/v1/configuration/team'),
        apiFetch('/v1/account/payment'),
        apiFetch('/v1/configuration/notifications'),
      ])
      const user = accountData.user ?? {}
      setProfile({
        merchant_name: user.merchant_name ?? '',
        first_name: user.first_name ?? '',
        middle_name: user.middle_name ?? '',
        last_name: user.last_name ?? '',
        contact_number: user.contact_number ?? '',
        address: user.address ?? '',
        email: user.email ?? '',
      })
      setTeam(Array.isArray(teamData.team) ? teamData.team : [])
      setPayment({ ...EMPTY_PAYMENT, ...(paymentData.payment ?? {}) })
      setNotifications({ ...EMPTY_NOTIFICATIONS, ...notificationData })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function showSaved(message) {
    setBanner(message)
    window.setTimeout(() => setBanner(''), 2800)
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await apiFetch('/v1/account', {
        method: 'PUT',
        body: JSON.stringify({
          ...profile,
          middle_name: profile.middle_name.trim() || null,
          address: profile.address.trim() || null,
        }),
      })
      const user = data.user ?? {}
      setProfile({
        merchant_name: user.merchant_name ?? profile.merchant_name,
        first_name: user.first_name ?? '',
        middle_name: user.middle_name ?? '',
        last_name: user.last_name ?? '',
        contact_number: user.contact_number ?? '',
        address: user.address ?? '',
        email: user.email ?? '',
      })
      updateMerchantSession({
        merchantName: user.merchant_name ?? profile.merchant_name,
        email: user.email ?? profile.email,
      })
      showSaved('Profile saved.')
      const teamData = await apiFetch('/v1/configuration/team')
      setTeam(Array.isArray(teamData.team) ? teamData.team : [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiFetch('/v1/account/password', {
        method: 'PUT',
        body: JSON.stringify(passwordForm),
      })
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' })
      showSaved('Password updated.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update password.')
    } finally {
      setSaving(false)
    }
  }

  async function inviteUser(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiFetch('/v1/configuration/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          name: invite.name.trim() || undefined,
          email: invite.email.trim(),
          role: invite.role,
        }),
      })
      setInvite({ name: '', email: '', role: 'staff' })
      const teamData = await apiFetch('/v1/configuration/team')
      setTeam(Array.isArray(teamData.team) ? teamData.team : [])
      showSaved('User added.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not add user.')
    } finally {
      setSaving(false)
    }
  }

  async function removeUser(member) {
    setSaving(true)
    setError('')
    try {
      await apiFetch(`/v1/configuration/team/${member.uuid}`, { method: 'DELETE' })
      setTeam((current) => current.filter((item) => item.uuid !== member.uuid))
      showSaved('User removed.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not remove user.')
    } finally {
      setSaving(false)
    }
  }

  async function changeRole(member, role) {
    setError('')
    try {
      await apiFetch(`/v1/configuration/team/${member.uuid}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      setTeam((current) => current.map((item) => (item.uuid === member.uuid ? { ...item, role } : item)))
      showSaved('Role updated.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update role.')
    }
  }

  async function savePayment(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await apiFetch('/v1/account/payment', {
        method: 'PUT',
        body: JSON.stringify({
          ...payment,
          depositPercent: Number(payment.depositPercent) || 0,
        }),
      })
      setPayment({ ...EMPTY_PAYMENT, ...(data.payment ?? {}) })
      showSaved('Payment settings saved.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save payment settings.')
    } finally {
      setSaving(false)
    }
  }

  async function saveNotifications(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await apiFetch('/v1/configuration/notifications', {
        method: 'PUT',
        body: JSON.stringify(notifications),
      })
      setNotifications({ ...EMPTY_NOTIFICATIONS, ...data })
      showSaved('Notification settings saved.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save notifications.')
    } finally {
      setSaving(false)
    }
  }

  if (requestedSection === 'billing') {
    return <Navigate to="/billing" replace />
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-[#f6f9ff] p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0f3f73]">Advanced</h1>
          <p className="mt-1 text-sm text-slate-500">Profile, users, payments, and account settings.</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSearchParams({ section: item.id }, { replace: true })
              setError('')
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
              section === item.id ? 'bg-[#1B4F8A] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {banner ? (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
          {banner}
        </div>
      ) : null}
      {error ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-slate-500">Loading settings…</p>
        ) : null}

        {!loading && section === 'profile' ? (
          <form onSubmit={saveProfile} className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-[#0f3f73]">Profile settings</h2>
            <p className="mt-1 text-sm text-slate-500">The name guests and your team see for this account.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                Business name
                <input
                  required
                  value={profile.merchant_name}
                  onChange={(event) => setProfile((current) => ({ ...current, merchant_name: event.target.value }))}
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                First name
                <input
                  required
                  value={profile.first_name}
                  onChange={(event) => setProfile((current) => ({ ...current, first_name: event.target.value }))}
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Middle name
                <input
                  value={profile.middle_name}
                  onChange={(event) => setProfile((current) => ({ ...current, middle_name: event.target.value }))}
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Last name
                <input
                  required
                  value={profile.last_name}
                  onChange={(event) => setProfile((current) => ({ ...current, last_name: event.target.value }))}
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Contact number
                <input
                  required
                  value={profile.contact_number}
                  onChange={(event) => setProfile((current) => ({ ...current, contact_number: event.target.value }))}
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                Email
                <input
                  required
                  type="email"
                  value={profile.email}
                  onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                Address
                <input
                  value={profile.address}
                  onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))}
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-xl bg-[#2B5AED] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        ) : null}

        {!loading && section === 'security' ? (
          <form onSubmit={savePassword} className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-[#0f3f73]">Security</h2>
            <p className="mt-1 text-sm text-slate-500">Change the password used to sign in to this merchant account.</p>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Current password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.current_password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, current_password: event.target.value }))
                  }
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                New password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={passwordForm.password}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Confirm new password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={passwordForm.password_confirmation}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, password_confirmation: event.target.value }))
                  }
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-xl bg-[#2B5AED] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Update password'}
            </button>
          </form>
        ) : null}

        {!loading && section === 'users' ? (
          <div className="space-y-4">
            <form onSubmit={inviteUser} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-[#0f3f73]">User management</h2>
              <p className="mt-1 text-sm text-slate-500">Add people who can help run this property.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.2fr_140px_auto]">
                <input
                  value={invite.name}
                  onChange={(event) => setInvite((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Name"
                  className={fieldClass()}
                />
                <input
                  required
                  type="email"
                  value={invite.email}
                  onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Email"
                  className={fieldClass()}
                />
                <select
                  value={invite.role}
                  onChange={(event) => setInvite((current) => ({ ...current, role: event.target.value }))}
                  className={fieldClass()}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#2B5AED] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
                >
                  Add user
                </button>
              </div>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {team.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No users yet.
                      </td>
                    </tr>
                  ) : (
                    team.map((member) => {
                      const isOwner = member.email === profile.email
                      return (
                        <tr key={member.uuid} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-bold text-[#0f3f73]">{member.name}</td>
                          <td className="px-4 py-3 text-slate-600">{member.email}</td>
                          <td className="px-4 py-3">
                            <select
                              value={member.role}
                              disabled={isOwner}
                              onChange={(event) => void changeRole(member, event.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                            >
                              {ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                  {isOwner && role.value === member.role ? ' (you)' : ''}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isOwner ? null : (
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => void removeUser(member)}
                                className="text-sm font-bold text-rose-700 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {!loading && section === 'payments' ? (
          <form onSubmit={savePayment} className="max-w-3xl space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-[#0f3f73]">Payment settings</h2>
              <p className="mt-1 text-sm text-slate-500">Choose how guests can pay and what you show on a booking.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Toggle
                  label="Cash"
                  checked={payment.acceptCash}
                  onChange={(value) => setPayment((current) => ({ ...current, acceptCash: value }))}
                />
                <Toggle
                  label="GCash"
                  checked={payment.acceptGcash}
                  onChange={(value) => setPayment((current) => ({ ...current, acceptGcash: value }))}
                />
                <Toggle
                  label="Bank transfer"
                  checked={payment.acceptBankTransfer}
                  onChange={(value) => setPayment((current) => ({ ...current, acceptBankTransfer: value }))}
                />
                <Toggle
                  label="Card"
                  checked={payment.acceptCard}
                  onChange={(value) => setPayment((current) => ({ ...current, acceptCard: value }))}
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Currency
                  <select
                    value={payment.currency}
                    onChange={(event) => setPayment((current) => ({ ...current, currency: event.target.value }))}
                    className={`mt-1 ${fieldClass()}`}
                  >
                    <option value="PHP">PHP</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Deposit percent
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!payment.depositRequired}
                    value={payment.depositPercent}
                    onChange={(event) =>
                      setPayment((current) => ({ ...current, depositPercent: event.target.value }))
                    }
                    className={`mt-1 ${fieldClass()}`}
                  />
                </label>
              </div>
              <div className="mt-3">
                <Toggle
                  label="Require a deposit"
                  hint="Guests are asked for this share of the stay total before arrival."
                  checked={payment.depositRequired}
                  onChange={(value) => setPayment((current) => ({ ...current, depositRequired: value }))}
                />
              </div>
            </div>

            {payment.acceptGcash ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black text-[#0f3f73]">GCash</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Account name
                    <input
                      value={payment.gcashName}
                      onChange={(event) => setPayment((current) => ({ ...current, gcashName: event.target.value }))}
                      className={`mt-1 ${fieldClass()}`}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Mobile number
                    <input
                      value={payment.gcashNumber}
                      onChange={(event) => setPayment((current) => ({ ...current, gcashNumber: event.target.value }))}
                      className={`mt-1 ${fieldClass()}`}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {payment.acceptBankTransfer ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black text-[#0f3f73]">Bank transfer</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Bank
                    <input
                      value={payment.bankName}
                      onChange={(event) => setPayment((current) => ({ ...current, bankName: event.target.value }))}
                      className={`mt-1 ${fieldClass()}`}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Account name
                    <input
                      value={payment.bankAccountName}
                      onChange={(event) =>
                        setPayment((current) => ({ ...current, bankAccountName: event.target.value }))
                      }
                      className={`mt-1 ${fieldClass()}`}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                    Account number
                    <input
                      value={payment.bankAccountNumber}
                      onChange={(event) =>
                        setPayment((current) => ({ ...current, bankAccountNumber: event.target.value }))
                      }
                      className={`mt-1 ${fieldClass()}`}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700">
                Instructions for guests
                <textarea
                  rows={4}
                  value={payment.instructions}
                  onChange={(event) => setPayment((current) => ({ ...current, instructions: event.target.value }))}
                  placeholder="Where to send proof of payment, office hours, and other notes."
                  className={`mt-1 ${fieldClass()}`}
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="mt-5 rounded-xl bg-[#2B5AED] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save payment settings'}
              </button>
            </div>
          </form>
        ) : null}

        {!loading && section === 'notifications' ? (
          <form onSubmit={saveNotifications} className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-[#0f3f73]">Notifications</h2>
            <p className="mt-1 text-sm text-slate-500">Choose which booking events should alert this account.</p>
            <div className="mt-4 space-y-3">
              {NOTIFICATION_FIELDS.map((field) => (
                <Toggle
                  key={field.key}
                  label={field.label}
                  hint={field.hint}
                  checked={Boolean(notifications[field.key])}
                  onChange={(value) => setNotifications((current) => ({ ...current, [field.key]: value }))}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-xl bg-[#2B5AED] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save notifications'}
            </button>
          </form>
        ) : null}

      </div>
    </div>
  )
}

export default AdvancedPage
