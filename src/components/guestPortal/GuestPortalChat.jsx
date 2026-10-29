import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../utils/api'
import { clearCustomerSession, getCustomerSession, getCustomerToken, setCustomerSession } from '../../utils/customerAuth'

function Field({ label, ...props }) {
  return (
    <label className="block text-left">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-[#1B4F8A] focus:ring-2"
      />
    </label>
  )
}

export default function GuestPortalChat({ slug, merchantName, accentColor = '#e8c872', placement = 'screen' }) {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(() => getCustomerSession())
  const [panel, setPanel] = useState('signin')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    address: '',
    contactNumber: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const threadRef = useRef(null)
  const loadGeneration = useRef(0)

  const live = Boolean(slug)

  useEffect(() => {
    if (!open || !live || !session) {
      return undefined
    }
    let cancelled = false

    async function load(quiet) {
      const generation = loadGeneration.current
      if (!quiet) {
        setBusy(true)
        setError('')
      }
      try {
        const data = await apiFetch(`/v1/public/direct-portals/${encodeURIComponent(slug)}/messages`, {
          authToken: getCustomerToken(),
        })
        if (cancelled || generation !== loadGeneration.current) {
          return
        }
        setMessages(Array.isArray(data?.messages) ? data.messages : [])
        setError('')
      } catch (cause) {
        if (!cancelled && generation === loadGeneration.current && !quiet) {
          setError(cause instanceof Error ? cause.message : 'Could not load messages.')
        }
      } finally {
        if (!cancelled && !quiet && generation === loadGeneration.current) {
          setBusy(false)
        }
      }
    }

    load(false)
    const timer = window.setInterval(() => {
      load(true)
    }, 5000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [open, live, session, slug])

  const latestMessageId = messages.at(-1)?.id ?? ''

  useEffect(() => {
    const node = threadRef.current
    if (!node) {
      return
    }
    node.scrollTop = node.scrollHeight
  }, [latestMessageId, messages.length])

  function remember(payload) {
    setCustomerSession({ token: payload.token, customer: payload.customer })
    setSession(getCustomerSession())
    setError('')
  }

  async function signIn(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await apiFetch('/v1/customer/login', {
        method: 'POST',
        authToken: '',
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      remember(data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  async function createAccount(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await apiFetch('/v1/customer/register', {
        method: 'POST',
        authToken: '',
        body: JSON.stringify({
          full_name: form.fullName,
          address: form.address,
          contact_number: form.contactNumber,
          email: form.email,
          password: form.password,
          password_confirmation: form.passwordConfirmation,
        }),
      })
      remember(data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the account.')
    } finally {
      setBusy(false)
    }
  }

  async function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !live) {
      return
    }
    loadGeneration.current += 1
    setBusy(true)
    setError('')
    try {
      const data = await apiFetch(`/v1/public/direct-portals/${encodeURIComponent(slug)}/messages`, {
        method: 'POST',
        authToken: getCustomerToken(),
        body: JSON.stringify({ body: text }),
      })
      setMessages(Array.isArray(data?.messages) ? data.messages : [])
      setDraft('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send the message.')
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    try {
      await apiFetch('/v1/customer/logout', { method: 'POST', authToken: getCustomerToken() })
    } catch {
      // The local session still ends if the token is already gone.
    }
    clearCustomerSession()
    setSession(null)
    setMessages([])
  }

  return (
    <div
      className={`pointer-events-none z-30 flex flex-col items-end justify-end gap-2 ${
        placement === 'frame'
          ? 'absolute bottom-4 right-4 top-16'
          : 'fixed bottom-4 right-4 max-h-[calc(100dvh-2rem)]'
      }`}
    >
      {open ? (
        <div className="pointer-events-auto flex max-h-full min-h-0 w-[min(20rem,calc(100vw-2rem))] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white" style={{ backgroundColor: '#1a1408' }}>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e8c872]">Message</p>
              <p className="truncate text-sm font-semibold">{merchantName}</p>
            </div>
            <button type="button" className="text-sm text-white/80" onClick={() => setOpen(false)} aria-label="Close messages">
              ×
            </button>
          </div>

          {!session ? (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  className={`rounded-full py-1.5 ${panel === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  onClick={() => setPanel('signin')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`rounded-full py-1.5 ${panel === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  onClick={() => setPanel('register')}
                >
                  Registration
                </button>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">A customer account is required to message {merchantName}.</p>
              {panel === 'signin' ? (
                <form className="space-y-2" onSubmit={signIn}>
                  <Field label="Email" type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                  <Field label="Password" type="password" required value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
                  <button type="submit" disabled={busy} className="w-full rounded-full py-2.5 text-xs font-black uppercase tracking-wide text-[#1a1408]" style={{ backgroundColor: accentColor }}>
                    Login
                  </button>
                </form>
              ) : (
                <form className="space-y-2" onSubmit={createAccount}>
                  <Field label="Full name" required value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
                  <Field label="Address" required value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
                  <Field label="Contact number" required value={form.contactNumber} onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))} />
                  <Field label="Email address" type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                  <Field label="Password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
                  <Field label="Confirmed" type="password" required value={form.passwordConfirmation} onChange={(e) => setForm((p) => ({ ...p, passwordConfirmation: e.target.value }))} />
                  <button type="submit" disabled={busy} className="w-full rounded-full py-2.5 text-xs font-black uppercase tracking-wide text-[#1a1408]" style={{ backgroundColor: accentColor }}>
                    Register
                  </button>
                </form>
              )}
              {error ? <p className="text-xs text-rose-600">{error}</p> : null}
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                <span className="truncate">{session.customer?.name}</span>
                <button type="button" className="font-semibold text-slate-600" onClick={signOut}>
                  Sign out
                </button>
              </div>
              <div ref={threadRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3">
                {messages.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-slate-500">{busy ? 'Loading…' : 'Send a message to the property.'}</p>
                ) : (
                  messages.map((item) => (
                    <div key={item.id} className={`flex ${item.from === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <p className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${item.from === 'customer' ? 'bg-[#1a1408] text-white' : 'bg-white text-slate-800'}`}>
                        {item.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <form className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-3 py-3" onSubmit={sendMessage}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message"
                  className="min-w-0 flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm outline-none"
                />
                <button type="submit" disabled={busy || !draft.trim()} className="rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide text-[#1a1408] disabled:opacity-40" style={{ backgroundColor: accentColor }}>
                  Send
                </button>
              </form>
              {error ? <p className="px-3 pb-3 text-xs text-rose-600">{error}</p> : null}
            </>
          )}
        </div>
      ) : null}
      <button
        type="button"
        className="pointer-events-auto shrink-0 rounded-full px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#1a1408] shadow-lg"
        style={{ backgroundColor: accentColor }}
        onClick={() => setOpen((value) => !value)}
      >
        Message
      </button>
    </div>
  )
}
