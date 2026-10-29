import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MERCHANT_HELP } from '../data/merchantHelp'

function topicText(topic) {
  const parts = [topic.title, topic.summary]
  for (const section of topic.sections) {
    parts.push(section.heading)
    if (section.paragraphs) parts.push(...section.paragraphs)
    if (section.items) parts.push(...section.items)
    if (section.steps) parts.push(...section.steps)
  }
  return parts.join('\n')
}

function matchesQuery(topic, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = topicText(topic).toLowerCase()
  return words.every((word) => haystack.includes(word))
}

function sectionMatches(section, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = [section.heading, ...(section.paragraphs ?? []), ...(section.items ?? []), ...(section.steps ?? [])]
    .join('\n')
    .toLowerCase()
  return words.every((word) => haystack.includes(word))
}

function snippet(topic, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return topic.summary
  const lines = topicText(topic).split('\n')
  const line = lines.find((item) => words.every((word) => item.toLowerCase().includes(word))) ?? lines[0]
  return line.length > 110 ? `${line.slice(0, 107)}…` : line
}

function Highlight({ text, query }) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return text
  const pattern = new RegExp(`(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig')
  const parts = String(text).split(pattern)
  return parts.map((part, index) =>
    words.includes(part.toLowerCase()) ? (
      <mark key={`${part}-${index}`} className="rounded bg-[#FDB927]/70 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}

function HelpPage() {
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(MERCHANT_HELP[0].id)

  const results = useMemo(
    () => MERCHANT_HELP.filter((topic) => matchesQuery(topic, query)),
    [query],
  )

  useEffect(() => {
    if (results.length === 0) return
    if (!results.some((topic) => topic.id === activeId)) {
      setActiveId(results[0].id)
    }
  }, [results, activeId])

  const active = results.find((topic) => topic.id === activeId) ?? results[0] ?? null
  const sections = useMemo(() => {
    if (!active) return []
    if (!query.trim()) return active.sections
    const matched = active.sections.filter((section) => sectionMatches(section, query))
    return matched.length > 0 ? matched : active.sections
  }, [active, query])

  useEffect(() => {
    if (!query.trim() || sections.length === 0) return
    document.getElementById(`help-section-${sections[0].heading}`)?.scrollIntoView({ block: 'nearest' })
  }, [query, activeId, sections])

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-[#f6f9ff] p-4">
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <header className="shrink-0 border-b border-slate-200 px-4 py-4">
          <h1 className="text-lg font-black tracking-tight text-[#0f3f73]">Help</h1>
          <p className="mt-0.5 text-xs text-slate-500">What each part of Hofros needs, how it works, and how to do it.</p>
          <label className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2.5">
            <span className="text-slate-400" aria-hidden="true">
              ⌕
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a task, field, or module"
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              aria-label="Search help"
            />
            {query ? (
              <button type="button" className="text-xs font-bold text-slate-500" onClick={() => setQuery('')}>
                Clear
              </button>
            ) : null}
          </label>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {query.trim() ? `${results.length} matching ${results.length === 1 ? 'topic' : 'topics'}` : `${MERCHANT_HELP.length} topics`}
          </p>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav className="min-h-0 overflow-y-auto border-b border-slate-200 lg:border-b-0 lg:border-r" aria-label="Help topics">
            {results.length === 0 ? (
              <p className="px-4 py-8 text-sm text-slate-500">No help topics match that search.</p>
            ) : (
              results.map((topic) => {
                const selected = topic.id === active?.id
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setActiveId(topic.id)}
                    className={`block w-full border-l-4 px-4 py-3 text-left ${
                      selected ? 'border-[#2B5AED] bg-[#eef3ff]' : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-sm font-black text-[#0f3f73]">{topic.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                      <Highlight text={snippet(topic, query)} query={query} />
                    </span>
                  </button>
                )
              })
            )}
          </nav>

          <article className="min-h-0 overflow-y-auto px-5 py-5">
            {active ? (
              <div className="mx-auto max-w-3xl">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[#0f3f73]">
                      <Highlight text={active.title} query={query} />
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      <Highlight text={active.summary} query={query} />
                    </p>
                  </div>
                  <Link
                    to={active.to}
                    className="shrink-0 rounded-full bg-[#2B5AED] px-4 py-2 text-xs font-black uppercase tracking-wide text-white"
                  >
                    Open {active.title}
                  </Link>
                </div>

                <div className="mt-6 space-y-6">
                  {(sections.length > 0 ? sections : []).map((section) => (
                    <section key={section.heading} id={`help-section-${section.heading}`} className="scroll-mt-4">
                      <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#1B4F8A]">{section.heading}</h3>
                      {section.paragraphs?.map((paragraph) => (
                        <p key={paragraph} className="mt-2 text-sm leading-relaxed text-slate-700">
                          <Highlight text={paragraph} query={query} />
                        </p>
                      ))}
                      {section.items ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
                          {section.items.map((item) => (
                            <li key={item}>
                              <Highlight text={item} query={query} />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {section.steps ? (
                        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                          {section.steps.map((step) => (
                            <li key={step}>
                              <Highlight text={step} query={query} />
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </section>
                  ))}
                  {query.trim() && sections.length === 0 ? (
                    <p className="text-sm text-slate-500">This topic matches the title, but none of its sections contain every word.</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Try a module name, a field such as email or GCash, or a task such as publish or check-in.</p>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}

export default HelpPage
