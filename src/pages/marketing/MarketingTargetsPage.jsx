import { useEffect, useState } from 'react'
import { AdminPanel, TableCell, TableHead, statusClass } from '../../components/admin/adminUi'
import { marketingFetch } from '../../utils/marketingApi'

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
const EMPTY = { kind: 'market', name: '', contactName: '', email: '', phone: '', location: '', rooms: '', status: 'target', notes: '' }
const FIELD = 'mt-1 h-10 w-full rounded-lg border border-[#e8e4dc] bg-white px-3 text-sm text-slate-800'

function stageLabel(status) {
  return STAGES.find((item) => item.id === status)?.label || status
}

function MarketingTargetsPage() {
  const [rows, setRows] = useState([])
  const [modal, setModal] = useState('')
  const [active, setActive] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState('target')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  function load() {
    return marketingFetch('/v1/marketing/home').then((data) => setRows(data.prospects ?? []))
  }

  useEffect(() => {
    load()
      .catch((requestError) => setError(requestError?.message || 'Could not load targets.'))
      .finally(() => setLoading(false))
  }, [])

  function close() {
    setModal('')
    setActive(null)
    setSaving(false)
  }

  async function saveTarget(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await marketingFetch('/v1/marketing/prospects', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          rooms: form.kind === 'market' && form.rooms !== '' ? Number(form.rooms) : null,
        }),
      })
      await load()
      setNotice('Target added to your list.')
      setForm(EMPTY)
      close()
    } catch (requestError) {
      setError(requestError?.message || 'Could not save this target.')
      setSaving(false)
    }
  }

  async function saveStatus(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await marketingFetch(`/v1/marketing/prospects/${active.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      await load()
      setNotice(`Status updated for ${active.name}.`)
      close()
    } catch (requestError) {
      setError(requestError?.message || 'Could not update the status.')
      setSaving(false)
    }
  }

  async function saveNote(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await marketingFetch(`/v1/marketing/prospects/${active.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body: note }),
      })
      await load()
      setNotice(`Note added for ${active.name}.`)
      close()
    } catch (requestError) {
      setError(requestError?.message || 'Could not add the note.')
      setSaving(false)
    }
  }

  return (
    <>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a16207]">Your list</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0b1020]">Targets</h1>
        </div>
        <button type="button" onClick={() => { setError(''); setForm(EMPTY); setModal('add') }} className="h-10 rounded-full bg-[#0b1020] px-4 text-xs font-semibold text-[#e8c872]">
          Add target
        </button>
      </header>
      {error && !modal ? <p className="mb-4 text-sm font-medium text-rose-600">{error}</p> : null}
      {notice ? <p className="mb-4 text-sm font-medium text-emerald-700">{notice}</p> : null}
      <AdminPanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-[#f1ece4]">
              <tr>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Latest note</TableHead>
                <TableHead />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#f6f3ee] last:border-0">
                  <TableCell className="font-semibold text-[#0b1020]">{row.name}</TableCell>
                  <TableCell>{row.kind === 'market' ? 'Target market' : 'Target client'}</TableCell>
                  <TableCell>{row.contactName || '—'}</TableCell>
                  <TableCell>{row.location || '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(row.status)}`}>{stageLabel(row.status)}</span>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-slate-500">{row.notes || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setActive(row); setStatus(row.status); setError(''); setModal('status') }} className="text-xs font-semibold text-[#8a5a12]">Update status</button>
                      <button type="button" onClick={() => { setActive(row); setNote(''); setError(''); setModal('note') }} className="text-xs font-semibold text-[#8a5a12]">Add note</button>
                    </div>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && rows.length === 0 ? <p className="px-4 py-8 text-sm text-slate-500">Loading targets…</p> : null}
        {!loading && rows.length === 0 ? <p className="px-4 py-8 text-sm text-slate-500">No targets yet. Add one, or ask an administrator to assign a target to you.</p> : null}
      </AdminPanel>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1020]/40 p-4" onClick={close}>
          <div role="dialog" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
            {modal === 'add' ? (
              <form onSubmit={saveTarget} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <h2 className="text-lg font-semibold text-[#0b1020] sm:col-span-2">Add target</h2>
                <label className="text-xs font-semibold text-slate-500">Record as
                  <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })} className={FIELD}>
                    {KINDS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-500">Stage
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={FIELD}>
                    {STAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-500 sm:col-span-2">{form.kind === 'market' ? 'Hotel name' : 'Client name'}
                  <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={FIELD} />
                </label>
                <label className="text-xs font-semibold text-slate-500">Contact
                  <input value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} className={FIELD} />
                </label>
                <label className="text-xs font-semibold text-slate-500">Location
                  <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className={FIELD} />
                </label>
                {error ? <p className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
                <button type="submit" disabled={saving} className="h-10 rounded-full bg-[#0b1020] px-4 text-xs font-semibold text-[#e8c872] disabled:opacity-50">{saving ? 'Saving…' : 'Add to list'}</button>
              </form>
            ) : null}
            {modal === 'status' && active ? (
              <form onSubmit={saveStatus}>
                <h2 className="text-lg font-semibold text-[#0b1020]">Update status</h2>
                <p className="mt-1 text-sm text-slate-600">{active.name}</p>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${FIELD} mt-3`}>
                  {STAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
                <button type="submit" disabled={saving} className="mt-4 h-10 rounded-full bg-[#0b1020] px-4 text-xs font-semibold text-[#e8c872] disabled:opacity-50">Save status</button>
              </form>
            ) : null}
            {modal === 'note' && active ? (
              <form onSubmit={saveNote}>
                <h2 className="text-lg font-semibold text-[#0b1020]">Add note</h2>
                <p className="mt-1 text-sm text-slate-600">{active.name}</p>
                <textarea required value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="mt-3 w-full rounded-lg border border-[#e8e4dc] px-3 py-2 text-sm" />
                {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
                <button type="submit" disabled={saving} className="mt-4 h-10 rounded-full bg-[#0b1020] px-4 text-xs font-semibold text-[#e8c872] disabled:opacity-50">Add note</button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}

export default MarketingTargetsPage
