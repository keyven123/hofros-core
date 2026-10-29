import { useEffect, useMemo, useState } from 'react'
import { AdminHeading, AdminPanel, AdminSearch, StatCard, TableCell, TableHead, matchesQuery, statusClass } from '../../components/admin/adminUi'
import { adminFetch } from '../../utils/adminApi'

const KINDS = [
  { id: 'market', label: 'Target market' },
  { id: 'client', label: 'Target client' },
]

const STAGES = [
  { id: 'target', label: 'Target' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'interested', label: 'Interested' },
  { id: 'onboarded', label: 'Onboarded' },
  { id: 'passed', label: 'Not pursuing' },
]

const EMPTY_FORM = {
  kind: 'market',
  name: '',
  contactName: '',
  email: '',
  phone: '',
  location: '',
  rooms: '',
  status: 'target',
  notes: '',
  ownerUserId: '',
}

const FIELD = 'mt-1 h-10 w-full rounded-lg border border-[#e8e4dc] bg-white px-3 text-sm text-slate-800'

function kindLabel(kind) {
  return KINDS.find((item) => item.id === kind)?.label || kind
}

function stageLabel(status) {
  return STAGES.find((item) => item.id === status)?.label || status
}

function formatWhen(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1020]/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#0b1020]">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-500">Close</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

function AdminMarketingPage() {
  const [rows, setRows] = useState([])
  const [accounts, setAccounts] = useState([])
  const [section, setSection] = useState('targets')
  const [accountForm, setAccountForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [modal, setModal] = useState('')
  const [active, setActive] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState('target')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  function load() {
    return adminFetch('/v1/admin/marketing').then((data) => {
      setRows(data.prospects ?? [])
      setAccounts(data.accounts ?? [])
    })
  }

  useEffect(() => {
    let cancelled = false
    load()
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load marketing records.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        if (kind !== 'all' && row.kind !== kind) return false
        return matchesQuery(query, [row.name, row.contactName, row.email, row.phone, row.location, row.notes, kindLabel(row.kind), stageLabel(row.status)])
      }),
    [rows, query, kind],
  )

  const markets = rows.filter((row) => row.kind === 'market').length
  const clients = rows.filter((row) => row.kind === 'client').length
  const onboarded = rows.filter((row) => row.status === 'onboarded').length

  function closeModal() {
    setModal('')
    setActive(null)
    setSaving(false)
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setError('')
    setModal('add')
  }

  function openStatus(row) {
    setActive(row)
    setStatus(row.status || 'target')
    setError('')
    setModal('status')
  }

  function openNote(row) {
    setActive(row)
    setNote('')
    setError('')
    setModal('note')
  }

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function saveTarget(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await adminFetch('/v1/admin/marketing', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          rooms: form.kind === 'market' && form.rooms !== '' ? Number(form.rooms) : null,
          ownerUserId: form.ownerUserId || null,
        }),
      })
      await load()
      setNotice('Target added to the list.')
      closeModal()
    } catch (requestError) {
      setError(requestError?.message || 'Could not save this record.')
      setSaving(false)
    }
  }

  async function saveStatus(event) {
    event.preventDefault()
    if (!active) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await adminFetch(`/v1/admin/marketing/${active.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      await load()
      setNotice(`Status updated for ${active.name}.`)
      closeModal()
    } catch (requestError) {
      setError(requestError?.message || 'Could not update the status.')
      setSaving(false)
    }
  }

  async function saveNote(event) {
    event.preventDefault()
    if (!active) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await adminFetch(`/v1/admin/marketing/${active.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body: note }),
      })
      await load()
      setNotice(`Note added for ${active.name}.`)
      closeModal()
    } catch (requestError) {
      setError(requestError?.message || 'Could not add the note.')
      setSaving(false)
    }
  }

  async function saveAccount(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await adminFetch('/v1/admin/marketing/accounts', {
        method: 'POST',
        body: JSON.stringify(accountForm),
      })
      await load()
      setAccountForm({ name: '', email: '', phone: '', password: '' })
      setNotice('Marketing account created. They can sign in at the marketing login.')
      closeModal()
    } catch (requestError) {
      setError(requestError?.message || 'Could not create the marketing account.')
      setSaving(false)
    }
  }

  async function remove(row) {
    setError('')
    setNotice('')
    try {
      await adminFetch(`/v1/admin/marketing/${row.id}`, { method: 'DELETE' })
      await load()
      setNotice(`${row.name} was removed.`)
    } catch (requestError) {
      setError(requestError?.message || 'Could not remove this record.')
    }
  }

  return (
    <>
      <AdminHeading
        kicker="Growth"
        title="Marketing"
        description="Record prospect hotels as target markets, and the people you plan to onboard as target clients."
      >
        <div className="flex flex-wrap items-center gap-2">
          <AdminSearch value={query} onChange={setQuery} placeholder="Search targets" />
          <button type="button" onClick={() => { setError(''); setModal('account') }} className="h-10 rounded-full border border-[#0b1020] px-4 text-xs font-semibold text-[#0b1020]">
            Add account
          </button>
          <button type="button" onClick={openAdd} className="h-10 rounded-full bg-[#0b1020] px-4 text-xs font-semibold text-[#e8c872]">
            Add target
          </button>
        </div>
      </AdminHeading>
      {error && !modal ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}
      {notice ? <p className="mb-4 text-sm font-medium text-emerald-700">{notice}</p> : null}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Target markets" value={loading ? '—' : markets} hint="Prospect hotels" />
        <StatCard label="Target clients" value={loading ? '—' : clients} hint="People to onboard" />
        <StatCard label="Onboarded" value={loading ? '—' : onboarded} hint="Already on Hofros" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ['targets', 'Targets'],
          ['accounts', 'Accounts'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${section === id ? 'bg-[#0b1020] text-[#e8c872]' : 'bg-white text-slate-600 ring-1 ring-[#e8e4dc]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'accounts' ? (
        <AdminPanel>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[#f1ece4]">
              <tr>
                <TableHead>Account</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Targets</TableHead>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-[#f6f3ee] last:border-0">
                  <TableCell className="font-semibold text-[#0b1020]">{account.name}</TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>{account.phone || '—'}</TableCell>
                  <TableCell>{account.targets}</TableCell>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && accounts.length === 0 ? <p className="px-4 py-8 text-sm text-slate-500">No marketing accounts yet.</p> : null}
        </AdminPanel>
      ) : (
      <>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ['all', `All ${rows.length}`],
          ['market', `Target markets ${markets}`],
          ['client', `Target clients ${clients}`],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${kind === id ? 'bg-[#0b1020] text-[#e8c872]' : 'bg-white text-slate-600 ring-1 ring-[#e8e4dc]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <AdminPanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-[#f1ece4]">
              <tr>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Latest note</TableHead>
                <TableHead />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="border-b border-[#f6f3ee] last:border-0">
                  <TableCell>
                    <p className="font-semibold text-[#0b1020]">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.email || 'No email'}</p>
                  </TableCell>
                  <TableCell>{kindLabel(row.kind)}</TableCell>
                  <TableCell>
                    <p>{row.contactName || '—'}</p>
                    <p className="text-xs text-slate-500">{row.phone || ''}</p>
                  </TableCell>
                  <TableCell>{row.location || '—'}</TableCell>
                  <TableCell>{row.kind === 'market' ? (row.rooms ?? '—') : '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${statusClass(row.status)}`}>
                      {stageLabel(row.status)}
                    </span>
                  </TableCell>
                  <TableCell>{row.ownerName || 'Unassigned'}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-slate-500">{row.notes || '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <button type="button" onClick={() => openStatus(row)} className="text-xs font-semibold text-[#8a5a12]">Update status</button>
                      <button type="button" onClick={() => openNote(row)} className="text-xs font-semibold text-[#8a5a12]">Add note</button>
                      <button type="button" onClick={() => remove(row)} className="text-xs font-semibold text-rose-600">Remove</button>
                    </div>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && visible.length === 0 ? <p className="px-4 py-8 text-sm text-slate-500">No targets yet. Add a prospect hotel or a client you want to onboard.</p> : null}
        {loading ? <p className="px-4 py-8 text-sm text-slate-500">Loading marketing records…</p> : null}
      </AdminPanel>
      </>
      )}

      {modal === 'add' ? (
        <Modal title="Add target" onClose={closeModal}>
          <form onSubmit={saveTarget} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-500">
              Record as
              <select value={form.kind} onChange={(event) => setField('kind', event.target.value)} className={FIELD}>
                {KINDS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Stage
              <select value={form.status} onChange={(event) => setField('status', event.target.value)} className={FIELD}>
                {STAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
              Marketing account
              <select value={form.ownerUserId} onChange={(event) => setField('ownerUserId', event.target.value)} className={FIELD}>
                <option value="">Unassigned</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
              {form.kind === 'market' ? 'Hotel name' : 'Client name'}
              <input required value={form.name} onChange={(event) => setField('name', event.target.value)} className={FIELD} />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Contact person
              <input value={form.contactName} onChange={(event) => setField('contactName', event.target.value)} className={FIELD} />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Email
              <input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} className={FIELD} />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Phone
              <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} className={FIELD} />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Location
              <input value={form.location} onChange={(event) => setField('location', event.target.value)} className={FIELD} />
            </label>
            {form.kind === 'market' ? (
              <label className="text-xs font-semibold text-slate-500">
                Estimated rooms
                <input type="number" min="0" value={form.rooms} onChange={(event) => setField('rooms', event.target.value)} className={FIELD} />
              </label>
            ) : null}
            <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
              Notes
              <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} rows={3} placeholder="Why this hotel or client is a target" className="mt-1 w-full rounded-lg border border-[#e8e4dc] px-3 py-2 text-sm text-slate-800" />
            </label>
            {error ? <p className="text-sm font-medium text-rose-600 sm:col-span-2">{error}</p> : null}
            <div className="sm:col-span-2">
              <button type="submit" disabled={saving} className="h-10 rounded-full bg-[#0b1020] px-4 text-xs font-semibold text-[#e8c872] disabled:opacity-50">
                {saving ? 'Saving…' : 'Add to list'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {modal === 'status' && active ? (
        <Modal title="Update status" onClose={closeModal}>
          <form onSubmit={saveStatus}>
            <p className="text-sm text-slate-600">{active.name}</p>
            <label className="mt-3 block text-xs font-semibold text-slate-500">
              Stage
              <select value={status} onChange={(event) => setStatus(event.target.value)} className={FIELD}>
                {STAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
            <button type="submit" disabled={saving} className="mt-4 h-10 rounded-full bg-[#0b1020] px-4 text-xs font-semibold text-[#e8c872] disabled:opacity-50">
              {saving ? 'Saving…' : 'Save status'}
            </button>
          </form>
        </Modal>
      ) : null}

      {modal === 'account' ? (
        <Modal title="Add marketing account" onClose={closeModal}>
          <p className="text-sm text-slate-600">This person signs in at the marketing login and sees the targets assigned to them.</p>
          <form onSubmit={saveAccount} className="mt-3 grid grid-cols-1 gap-3">
            <label className="text-xs font-semibold text-slate-500">
              Name
              <input required value={accountForm.name} onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))} className={FIELD} />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Email
              <input required type="email" value={accountForm.email} onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))} className={FIELD} />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Phone
              <input value={accountForm.phone} onChange={(event) => setAccountForm((current) => ({ ...current, phone: event.target.value }))} className={FIELD} />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Password
              <input required type="password" minLength={8} value={accountForm.password} onChange={(event) => setAccountForm((current) => ({ ...current, password: event.target.value }))} className={FIELD} />
            </label>
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            <button type="submit" disabled={saving} className="h-10 w-fit rounded-full bg-[#0b1020] px-4 text-xs font-semibold text-[#e8c872] disabled:opacity-50">
              {saving ? 'Saving…' : 'Create account'}
            </button>
          </form>
        </Modal>
      ) : null}

      {modal === 'note' && active ? (
        <Modal title="Add note" onClose={closeModal}>
          <p className="text-sm text-slate-600">{active.name}</p>
          {(active.noteLog ?? []).length > 0 ? (
            <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto">
              {active.noteLog.map((entry) => (
                <li key={entry.id} className="rounded-lg bg-[#f6f3ee] px-3 py-2">
                  <p className="text-sm text-[#0b1020]">{entry.body}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{formatWhen(entry.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No notes yet.</p>
          )}
          <form onSubmit={saveNote} className="mt-3">
            <label className="block text-xs font-semibold text-slate-500">
              New note
              <textarea required value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-[#e8e4dc] px-3 py-2 text-sm text-slate-800" />
            </label>
            {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
            <button type="submit" disabled={saving} className="mt-4 h-10 rounded-full bg-[#0b1020] px-4 text-xs font-semibold text-[#e8c872] disabled:opacity-50">
              {saving ? 'Saving…' : 'Add note'}
            </button>
          </form>
        </Modal>
      ) : null}
    </>
  )
}

export default AdminMarketingPage
