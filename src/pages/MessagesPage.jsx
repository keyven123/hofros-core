import { useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '../utils/api'

const AVATAR_TONES = [
  'bg-[#1B4F8A] text-white',
  'bg-[#2B5AED] text-white',
  'bg-teal-600 text-white',
  'bg-amber-500 text-[#0f3f73]',
  'bg-sky-600 text-white',
  'bg-indigo-600 text-white',
]

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function toneFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % AVATAR_TONES.length
  return AVATAR_TONES[hash]
}

function lastMessage(thread) {
  return thread.messages[thread.messages.length - 1]
}

function MessagesPage() {
  const [threads, setThreads] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [showThread, setShowThread] = useState(false)
  const [loadError, setLoadError] = useState('')
  const scrollerRef = useRef(null)
  const loadGeneration = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const generation = loadGeneration.current
      try {
        const data = await apiFetch('/v1/messages')
        if (cancelled || generation !== loadGeneration.current) {
          return
        }
        setThreads(Array.isArray(data?.threads) ? data.threads : [])
        setLoadError('')
      } catch (cause) {
        if (!cancelled && generation === loadGeneration.current) {
          setLoadError(cause instanceof Error ? cause.message : 'Could not load messages.')
        }
      }
    }

    load()
    const timer = window.setInterval(load, 5000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const unreadCount = threads.filter((thread) => thread.unread).length
  const visibleThreads = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return threads
    return threads.filter((thread) => {
      const preview = lastMessage(thread)?.text ?? ''
      return [thread.name, thread.property, thread.place, preview].some((value) =>
        value.toLowerCase().includes(q),
      )
    })
  }, [query, threads])

  const active = threads.find((thread) => thread.id === activeId) ?? visibleThreads[0] ?? null

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [active?.id, active?.messages.length])

  useEffect(() => {
    setThreads((current) => {
      const thread = current.find((item) => item.id === activeId)
      if (!thread?.unread) return current
      return current.map((item) => (item.id === activeId ? { ...item, unread: false } : item))
    })
  }, [activeId])

  function openThread(id) {
    setActiveId(id)
    setShowThread(true)
    setThreads((current) => current.map((thread) => (thread.id === id ? { ...thread, unread: false } : thread)))
    apiFetch(`/v1/messages/${encodeURIComponent(id)}/read`, { method: 'POST' }).catch(() => {})
  }

  async function sendReply() {
    const text = draft.trim()
    if (!text || !active) return
    loadGeneration.current += 1
    setDraft('')
    try {
      const data = await apiFetch(`/v1/messages/${encodeURIComponent(active.id)}`, {
        method: 'POST',
        body: JSON.stringify({ body: text }),
      })
      const nextMessages = Array.isArray(data?.messages) ? data.messages : []
      setThreads((current) =>
        current.map((thread) =>
          thread.id === active.id ? { ...thread, unread: false, messages: nextMessages } : thread,
        ),
      )
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : 'Could not send the reply.')
      setDraft(text)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-[#f6f9ff] p-4">
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight text-[#0f3f73]">Messages</h1>
            <p className="text-xs text-slate-500">
              {loadError || 'Messages from customers on your booking site'}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#FDB927] px-3 py-1 text-xs font-black text-[#0f3f73]">
            {unreadCount} unread
          </span>
        </header>

        <div className={`messages-split ${showThread ? 'is-thread' : ''}`}>
          <aside className="messages-list border-slate-200 lg:border-r">
            <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
              <p className="text-sm font-black text-[#0f3f73]">Customers</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                {threads.length}
              </span>
            </div>
            <div className="px-3 pb-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2">
                <span className="text-slate-400" aria-hidden="true">
                  ⌕
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search customers, stays, or messages"
                  className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  aria-label="Search conversations"
                />
              </label>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {visibleThreads.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  {query.trim() ? 'No conversations match your search.' : 'No conversations yet.'}
                </p>
              ) : (
                visibleThreads.map((thread) => {
                  const preview = lastMessage(thread)
                  const selected = active?.id === thread.id
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => openThread(thread.id)}
                      className={`flex w-full items-start gap-3 border-l-4 px-3 py-3 text-left transition ${
                        selected
                          ? 'border-[#2B5AED] bg-[#eef3ff]'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ${toneFor(thread.id)}`}
                      >
                        {initials(thread.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-black text-[#0f3f73]">{thread.name}</span>
                          <span className="shrink-0 text-[11px] font-semibold text-slate-400">{preview?.at}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{thread.email}</span>
                        <span className="mt-1 flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{preview?.text}</span>
                          {thread.unread ? (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#2B5AED]" aria-label="Unread" />
                          ) : null}
                        </span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          <section className="messages-thread">
            {active ? (
              <>
                <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setShowThread(false)}
                    className="messages-back h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm font-bold text-[#0f3f73]"
                    aria-label="Back to customers"
                  >
                    ←
                  </button>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ${toneFor(active.id)}`}
                  >
                    {initials(active.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#0f3f73]">{active.name}</p>
                    <p className="truncate text-xs text-slate-500">{active.email}</p>
                  </div>
                </div>

                <div ref={scrollerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f8fbff] px-4 py-4">
                  {active.messages.map((message) => {
                    const mine = message.from === 'merchant'
                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[min(28rem,80%)] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div
                            className={`rounded-2xl px-3.5 py-2 text-sm leading-5 ${
                              mine
                                ? 'rounded-br-md bg-[#1B4F8A] text-white'
                                : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                            }`}
                          >
                            {message.text}
                          </div>
                          <p className={`mt-1 text-[11px] font-medium ${mine ? 'text-slate-400' : 'text-slate-400'}`}>
                            {message.at}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <form
                  className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-3 py-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    sendReply()
                  }}
                >
                  <label className="sr-only" htmlFor="message-reply">
                    Reply to {active.name}
                  </label>
                  <input
                    id="message-reply"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Reply to ${active.name}`}
                    className="min-w-0 flex-1 rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm text-slate-800 outline-none ring-[#2B5AED] placeholder:text-slate-400 focus:ring-2"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2B5AED] text-white shadow-sm transition hover:bg-[#1B4F8A] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                      <path d="M3.4 20.6 21 12 3.4 3.4l2.2 7.2L16 12l-10.4 1.4-2.2 7.2Z" />
                    </svg>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-sm text-slate-500">
                No conversations yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
