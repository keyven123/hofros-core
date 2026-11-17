import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/api'

const GUIDE_STEPS = [
  {
    id: 'accommodation',
    title: 'Create an accommodation',
    to: '/configuration?tab=property',
    bullets: [
      'Open Configuration → Accommodation.',
      'Add your property name, address, and contact details.',
      'Save so rooms and rates can be attached to this property.',
    ],
  },
  {
    id: 'rooms',
    title: 'Create rooms',
    to: '/configuration?tab=units',
    bullets: [
      'Open Configuration → Rooms/Units.',
      'Add each bookable room with beds, guest limit, and type.',
      'Set status to Active so it can appear on your booking site.',
    ],
  },
  {
    id: 'rates',
    title: 'Set availability & base rates',
    to: '/configuration?tab=rates',
    bullets: [
      'Open Configuration → Availability / Base Rates.',
      'Choose the accommodation and room, then save nightly prices.',
      'Optional: use Unit Schedule to control which weekdays are bookable.',
    ],
  },
  {
    id: 'direct_website',
    title: 'Create your direct website',
    to: '/bookingportals',
    bullets: [
      'Open Booking Portals.',
      'Choose Build a direct website, design the guest page, then publish.',
      'Copy your guest booking link when the site is live.',
    ],
  },
]

function GettingStartedPage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiFetch('/v1/getting-started')
      .then((data) => {
        if (!cancelled) setProgress(data)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.message || 'Could not load getting started.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function proceedToDashboard() {
    setSaving(true)
    setError('')
    try {
      const data = await apiFetch('/v1/getting-started/dismiss', { method: 'POST' })
      setProgress(data)
      window.dispatchEvent(new CustomEvent('hofros-getting-started', { detail: data }))
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError?.message || 'Could not continue to the dashboard.')
    } finally {
      setSaving(false)
    }
  }

  const doneMap = Object.fromEntries((progress?.steps ?? []).map((step) => [step.id, step.done]))

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[#f6f9ff]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 md:px-6">
        <header className="rounded-2xl border border-[#c7dbf5] bg-gradient-to-br from-[#eef6ff] via-white to-[#fff8e8] px-5 py-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0c4a84]">Getting started</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0d3f71]">
            Set up Hofros in four steps
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Follow this guide once to create your accommodation, rooms, rates, and direct booking website.
            You can continue to the dashboard anytime — unfinished steps stay as a checklist next to Help.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={proceedToDashboard}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-3 text-sm font-black text-[#0f3f72] shadow-[0_10px_22px_rgba(245,158,11,0.28)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saving ? 'Opening dashboard…' : 'Proceed to dashboard'}
            </button>
            <p className="text-xs font-semibold text-slate-500">
              One-time guide · checklist tracks what is still unfinished
            </p>
          </div>
          {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
        </header>

        <ol className="space-y-3">
          {GUIDE_STEPS.map((step, index) => {
            const done = Boolean(doneMap[step.id])
            return (
              <li
                key={step.id}
                className={`rounded-2xl border bg-white px-5 py-4 shadow-sm ${
                  done ? 'border-emerald-200' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0c4a84] text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <h2 className="text-lg font-black text-[#0d3f71]">{step.title}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {done ? 'Done' : 'To do'}
                      </span>
                    </div>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {step.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    to={step.to}
                    className="shrink-0 rounded-xl border border-slate-200 bg-[#f8fbff] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#0f3f73] transition hover:border-[#2B5AED] hover:bg-white"
                  >
                    Open step
                  </Link>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Ready to explore the rest of Hofros? You can finish any remaining setup later from the checklist
            above Help in the sidebar.
          </p>
          <button
            type="button"
            onClick={proceedToDashboard}
            disabled={saving}
            className="mt-4 rounded-xl bg-[#2B5AED] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {saving ? 'Opening dashboard…' : 'Proceed to dashboard'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GettingStartedPage
