import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GuestPortalMicrosite from '../components/guestPortal/GuestPortalMicrosite'
import { DEFAULT_HERO_BANNER_URL, HERO_BANNER_PRESETS } from '../data/heroBannerPresets'
import { apiFetch } from '../utils/api'
import { emptyGuestPortalLayout } from '../utils/guestPortalLayout'

const THEME_PRESETS = [
  {
    id: 'soft_friendly',
    name: 'Soft & Friendly',
    swatch: 'from-sky-200 to-amber-100',
    primary: '#38bdf8',
    accent: '#fcd34d',
  },
  {
    id: 'bold_modern',
    name: 'Bold & Modern',
    swatch: 'from-[#1B4F8A] to-[#F5A623]',
    primary: '#1B4F8A',
    accent: '#F5A623',
  },
  {
    id: 'clean_minimal',
    name: 'Clean Minimal',
    swatch: 'from-blue-600 to-slate-100',
    primary: '#2563eb',
    accent: '#e2e8f0',
  },
  {
    id: 'nature_warm',
    name: 'Nature & Warm',
    swatch: 'from-emerald-600 to-amber-100',
    primary: '#15803d',
    accent: '#fef3c7',
  },
]

const SECTION_DEFS = [
  { id: 'hero', title: 'Hero Banner', subtitle: 'Main image and headline' },
  { id: 'units', title: 'Available Units', subtitle: 'Your rooms & properties' },
  { id: 'amenities', title: 'Amenities', subtitle: 'What you offer' },
  { id: 'reviews', title: 'Guest Reviews', subtitle: 'Social proof & testimonials' },
  { id: 'contact', title: 'Contact & Map', subtitle: 'Location and contact form' },
]

function GlobeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function PaletteTabIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  )
}

function ContentTabIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
    </svg>
  )
}

function SectionsTabIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function DragHandleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.2" />
      <circle cx="15" cy="6" r="1.2" />
      <circle cx="9" cy="12" r="1.2" />
      <circle cx="15" cy="12" r="1.2" />
      <circle cx="9" cy="18" r="1.2" />
      <circle cx="15" cy="18" r="1.2" />
    </svg>
  )
}

function isValidHex(v) {
  return /^#[0-9A-Fa-f]{6}$/.test((v ?? '').trim())
}

function SectionToggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-11 shrink-0 rounded-full border transition ${
        checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-slate-200'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
          checked ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function PortalPreview({
  previewMode,
  previewUrl,
  merchantName,
  headline,
  message,
  pageTitle,
  primaryColor,
  accentColor,
  heroImageUrl,
  layout,
  merchantSlug,
  themePreset,
  units,
}) {
  const frameClass =
    previewMode === 'mobile'
      ? 'mx-auto w-full max-w-[min(100%,380px)] shadow-2xl'
      : 'w-full max-w-full shadow-2xl lg:max-w-[min(90rem,calc(100%-1rem))]'

  return (
    <div className={`rounded-t-xl border border-slate-300/80 bg-white ${frameClass}`}>
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
        <span className="inline-flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <div className="mx-auto min-w-0 flex-1 text-center">
          <div className="truncate rounded-md bg-white px-3 py-1 text-[11px] text-slate-500">{previewUrl}</div>
          <p className="mt-1 truncate text-[10px] font-semibold text-slate-400" title={pageTitle?.trim() || undefined}>
            Tab:{' '}
            {pageTitle?.trim() ||
              `${(layout?.businessName ?? '').trim() || merchantName || 'Your property'} · Book direct`}
          </p>
        </div>
      </div>
      <GuestPortalMicrosite
        layout={layout}
        headline={headline}
        message={message}
        primaryColor={primaryColor}
        accentColor={accentColor}
        heroImageUrl={heroImageUrl}
        merchantNameFallback={merchantName}
        slug={merchantSlug}
        themePreset={themePreset}
        units={units}
        LinkComponent="span"
        linkHomeProps={{}}
      />
    </div>
  )
}

function mergeLayoutFromApi(raw) {
  const base = emptyGuestPortalLayout()
  if (!raw || typeof raw !== 'object') {
    return base
  }
  return {
    ...base,
    ...raw,
    amenities: Array.isArray(raw.amenities) ? raw.amenities : base.amenities,
    reviews: Array.isArray(raw.reviews) ? raw.reviews : base.reviews,
    sectionOrder: Array.isArray(raw.sectionOrder) ? raw.sectionOrder : base.sectionOrder,
    sectionVisibility: { ...base.sectionVisibility, ...(raw.sectionVisibility || {}) },
    showReviews: raw.showReviews !== false,
    showMap: raw.showMap !== false,
  }
}

function DirectPortalDesignPage() {
  const navigate = useNavigate()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const [tab, setTab] = useState('design')
  const [previewMode, setPreviewMode] = useState('desktop')

  const [merchantSlug, setMerchantSlug] = useState('')
  const [merchantName, setMerchantName] = useState('')
  const [headline, setHeadline] = useState('')
  const [message, setMessage] = useState('')
  const [layout, setLayout] = useState(() => emptyGuestPortalLayout())
  const [themePreset, setThemePreset] = useState('bold_modern')
  const [primaryColor, setPrimaryColor] = useState('#1B4F8A')
  const [accentColor, setAccentColor] = useState('#F5A623')
  const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_HERO_BANNER_URL)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroUploadError, setHeroUploadError] = useState(null)
  const heroFileInputRef = useRef(null)
  const [units, setUnits] = useState([])
  const [guestPortalLive, setGuestPortalLive] = useState(false)
  const [amenityDraft, setAmenityDraft] = useState('')
  const [dragId, setDragId] = useState(null)
  const [pageTitle, setPageTitle] = useState('')

  const previewUrl = useMemo(() => {
    const host = typeof window !== 'undefined' ? window.location.host : 'hofro.com'
    return `https://${host}/${merchantSlug || 'my-hotel'}/directportal`
  }, [merchantSlug])

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiFetch('/v1/booking-portals/direct-website/settings')
      if (!mountedRef.current) {
        return
      }
      setMerchantSlug(data.merchantSlug ?? '')
      setMerchantName(data.merchantName ?? '')
      setHeadline(
        typeof data.headline === 'string' && data.headline.trim()
          ? data.headline
          : data.merchantName || 'My Hotel',
      )
      setMessage(
        typeof data.message === 'string' && data.message.trim()
          ? data.message
          : 'Your home away from home.',
      )
      setLayout(mergeLayoutFromApi(data.layout))
      setThemePreset(data.themePreset ?? 'bold_modern')
      setPrimaryColor(isValidHex(data.primaryColor) ? data.primaryColor : '#1B4F8A')
      setAccentColor(isValidHex(data.accentColor) ? data.accentColor : '#F5A623')
      setHeroImageUrl(
        typeof data.heroImageUrl === 'string' && data.heroImageUrl.trim() ? data.heroImageUrl.trim() : DEFAULT_HERO_BANNER_URL,
      )
      setUnits(Array.isArray(data.units) ? data.units : [])
      setGuestPortalLive(Boolean(data.guestPortalLive))
      setPageTitle(typeof data.pageTitle === 'string' ? data.pageTitle : '')
    } catch (e) {
      if (!mountedRef.current) {
        return
      }
      setError(e instanceof Error ? e.message : 'Could not load settings.')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  function applyPreset(preset) {
    setThemePreset(preset.id)
    setPrimaryColor(preset.primary)
    setAccentColor(preset.accent)
  }

  function buildPayload() {
    return {
      headline,
      message,
      pageTitle: pageTitle.trim() || null,
      themePreset,
      primaryColor,
      accentColor,
      heroImageUrl: heroImageUrl.trim() || DEFAULT_HERO_BANNER_URL,
      layout,
    }
  }

  async function uploadHeroImage(file) {
    setHeroUploadError(null)
    setHeroUploading(true)
    try {
      const body = new FormData()
      body.append('image', file)
      const data = await apiFetch('/v1/booking-portals/direct-website/hero-image', {
        method: 'POST',
        body,
      })
      if (typeof data.heroImageUrl === 'string' && data.heroImageUrl.trim()) {
        setHeroImageUrl(data.heroImageUrl.trim())
      }
      setToast({ type: 'ok', text: typeof data.message === 'string' ? data.message : 'Photo uploaded.' })
      window.setTimeout(() => setToast(null), 2600)
    } catch (e) {
      setHeroUploadError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setHeroUploading(false)
    }
  }

  function setSectionVisible(id, value) {
    setLayout((prev) => ({
      ...prev,
      sectionVisibility: { ...prev.sectionVisibility, [id]: value },
    }))
  }

  function moveSectionInOrder(fromId, toId) {
    setLayout((prev) => {
      const order = [...prev.sectionOrder]
      const i = order.indexOf(fromId)
      const j = order.indexOf(toId)
      if (i === -1 || j === -1 || i === j) {
        return prev
      }
      order.splice(i, 1)
      order.splice(j, 0, fromId)
      return { ...prev, sectionOrder: order }
    })
  }

  function addAmenity() {
    const t = amenityDraft.trim()
    if (!t) {
      return
    }
    setLayout((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(t) ? prev.amenities : [...prev.amenities, t].slice(0, 40),
    }))
    setAmenityDraft('')
  }

  function removeAmenity(label) {
    setLayout((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== label),
    }))
  }

  function updateReview(index, field, value) {
    setLayout((prev) => {
      const reviews = [...prev.reviews]
      const row = { ...reviews[index], [field]: value }
      if (field === 'rating') {
        row.rating = Math.min(5, Math.max(1, parseInt(value, 10) || 5))
      }
      reviews[index] = row
      return { ...prev, reviews }
    })
  }

  function addReview() {
    setLayout((prev) => {
      if (prev.reviews.length >= 8) {
        return prev
      }
      return {
        ...prev,
        reviews: [...prev.reviews, { name: 'Guest', initial: 'G', rating: 5, text: 'Great stay.' }],
      }
    })
  }

  function removeReview(index) {
    setLayout((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((_, i) => i !== index),
    }))
  }

  async function handleSaveDraft() {
    if (!isValidHex(primaryColor) || !isValidHex(accentColor)) {
      setToast({ type: 'error', text: 'Use full hex colors like #1B4F8A and #F5A623.' })
      return
    }
    setSaving(true)
    setToast(null)
    try {
      const data = await apiFetch('/v1/booking-portals/direct-website/content', {
        method: 'PATCH',
        body: JSON.stringify(buildPayload()),
      })
      if (!mountedRef.current) {
        return
      }
      setToast({ type: 'ok', text: data?.message || 'Draft saved.' })
    } catch (e) {
      if (!mountedRef.current) {
        return
      }
      setToast({ type: 'error', text: e instanceof Error ? e.message : 'Save failed.' })
    } finally {
      if (mountedRef.current) {
        setSaving(false)
      }
    }
  }

  async function handleFinishForTesting() {
    if (!isValidHex(primaryColor) || !isValidHex(accentColor)) {
      setToast({ type: 'error', text: 'Use full hex colors like #1B4F8A and #F5A623.' })
      return
    }
    if (!headline.trim() || !message.trim()) {
      setToast({ type: 'error', text: 'Add a hero title and tagline on the Content tab.' })
      setTab('content')
      return
    }
    setSaving(true)
    setToast(null)
    try {
      const body = buildPayload()
      await apiFetch('/v1/booking-portals/direct-website/content', {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      await apiFetch('/v1/booking-portals/direct-website/design', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (!mountedRef.current) {
        return
      }
      navigate('/direct-website-builder', {
        state: { flash: 'Design saved. You can switch to Live from the website builder when ready.' },
      })
    } catch (e) {
      if (!mountedRef.current) {
        return
      }
      setToast({ type: 'error', text: e instanceof Error ? e.message : 'Save failed.' })
    } finally {
      if (mountedRef.current) {
        setSaving(false)
      }
    }
  }

  async function handlePublishWebsite() {
    if (!isValidHex(primaryColor) || !isValidHex(accentColor)) {
      setToast({ type: 'error', text: 'Use full hex colors like #1B4F8A and #F5A623.' })
      return
    }
    if (!headline.trim() || !message.trim()) {
      setToast({ type: 'error', text: 'Add a hero title and tagline on the Content tab.' })
      setTab('content')
      return
    }
    setPublishing(true)
    setToast(null)
    try {
      const body = buildPayload()
      await apiFetch('/v1/booking-portals/direct-website/content', {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      await apiFetch('/v1/booking-portals/direct-website/design', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      await apiFetch('/v1/booking-portals/direct-website/live', {
        method: 'PATCH',
        body: JSON.stringify({ live: true }),
      })
      if (!mountedRef.current) {
        return
      }
      navigate('/direct-website-builder', {
        state: { flash: 'Website published — your direct portal is live for guests.' },
      })
    } catch (e) {
      if (!mountedRef.current) {
        return
      }
      setToast({ type: 'error', text: e instanceof Error ? e.message : 'Publish failed.' })
    } finally {
      if (mountedRef.current) {
        setPublishing(false)
      }
    }
  }

  const tabs = [
    { id: 'design', label: 'Design', Icon: PaletteTabIcon },
    { id: 'content', label: 'Content', Icon: ContentTabIcon },
    { id: 'sections', label: 'Sections', Icon: SectionsTabIcon },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-200/90">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#0a2344] bg-[#0c2d5a] px-4 py-3 text-white md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <GlobeIcon className="h-6 w-6 shrink-0 text-sky-200" />
          <h1 className="truncate text-lg font-black tracking-tight md:text-xl">Website Builder</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/direct-website-builder"
            className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white/90 transition hover:bg-white/15 md:text-sm"
          >
            Back
          </Link>
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => void handleSaveDraft()}
            className="rounded-lg border border-white bg-white px-3 py-2 text-xs font-black text-[#0c2d5a] shadow-sm transition hover:bg-slate-50 disabled:opacity-60 md:text-sm"
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={saving || loading || publishing}
            onClick={() => void handleFinishForTesting()}
            className="rounded-lg border border-amber-300/80 bg-amber-400/90 px-3 py-2 text-xs font-black text-[#0f3f73] shadow-sm transition hover:bg-amber-400 md:text-sm"
          >
            Finish for testing
          </button>
          <button
            type="button"
            disabled={publishing || loading || guestPortalLive}
            onClick={() => void handlePublishWebsite()}
            className="rounded-lg px-3 py-2 text-xs font-black text-[#0f3f73] shadow-sm transition hover:brightness-105 disabled:opacity-50 md:text-sm"
            style={{ backgroundColor: '#F5A623' }}
            title={guestPortalLive ? 'Already live — use Website builder to switch to testing if needed.' : ''}
          >
            {publishing ? 'Publishing…' : guestPortalLive ? 'Live' : 'Publish Website'}
          </button>
        </div>
      </header>

      {toast && (
        <div
          className={`mx-4 mt-3 rounded-lg border px-3 py-2 text-sm font-medium md:mx-6 ${
            toast.type === 'ok'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-rose-300 bg-rose-50 text-rose-900'
          }`}
        >
          {toast.text}
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 md:mx-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-slate-600">Loading builder…</div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-slate-300/80 overflow-hidden lg:grid-cols-[400px_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
          <aside className="flex min-h-0 flex-col overflow-hidden bg-white max-lg:max-h-[min(42vh,22rem)] max-lg:overflow-y-auto lg:min-h-0">
            <div className="flex shrink-0 border-b border-slate-200">
              {tabs.map((t) => {
                const Icon = t.Icon
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`flex flex-1 flex-col items-center gap-1 px-1 py-3 text-[10px] font-black uppercase tracking-wide text-slate-500 sm:flex-row sm:text-xs md:text-sm ${
                      tab === t.id ? 'border-b-2 border-[#1B4F8A] text-[#1B4F8A]' : 'hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" />
                    <span>{t.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
              {tab === 'design' && (
                <>
                  <section>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Theme</h2>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {THEME_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyPreset(p)}
                          className={`rounded-xl border p-2 text-left transition ${
                            themePreset === p.id
                              ? 'border-[#1B4F8A] ring-2 ring-[#1B4F8A]/30'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className={`h-10 rounded-lg bg-gradient-to-br ${p.swatch}`} />
                          <p className="mt-2 text-[11px] font-bold leading-tight text-[#0f3f73]">{p.name}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Brand colors</h2>
                    <div className="mt-3 space-y-3">
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-600">Primary color</span>
                        <div className="mt-1 flex gap-2">
                          <input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 font-mono text-xs"
                          />
                          <input
                            type="color"
                            value={isValidHex(primaryColor) ? primaryColor : '#1B4F8A'}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-10 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                            aria-label="Pick primary color"
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-600">Accent color</span>
                        <div className="mt-1 flex gap-2">
                          <input
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 font-mono text-xs"
                          />
                          <input
                            type="color"
                            value={isValidHex(accentColor) ? accentColor : '#F5A623'}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="h-10 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                            aria-label="Pick accent color"
                          />
                        </div>
                      </label>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Hero banner</h2>
                    <p className="mt-1 text-[11px] leading-snug text-slate-500">
                      Choose a hotel or room style. You can still upload your own photo — it is saved on the server.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {HERO_BANNER_PRESETS.map((preset) => {
                        const selected = heroImageUrl.trim() === preset.url
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setHeroUploadError(null)
                              setHeroImageUrl(preset.url)
                            }}
                            className={`group relative overflow-hidden rounded-xl border-2 text-left shadow-sm transition ${
                              selected
                                ? 'border-blue-600 ring-2 ring-blue-200'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt=""
                              className="aspect-[16/10] w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_HERO_BANNER_URL
                              }}
                            />
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-2 pb-2 pt-8">
                              <span className="block text-[10px] font-black uppercase tracking-wide text-white">
                                {preset.name}
                              </span>
                              <span className="mt-0.5 block text-[9px] font-medium text-white/85">{preset.hint}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3">
                      <p className="text-[11px] font-bold text-slate-600">Your photo</p>
                      <input
                        ref={heroFileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="sr-only"
                        aria-label="Upload hero photo"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          event.target.value = ''
                          if (file) {
                            void uploadHeroImage(file)
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={heroUploading}
                        onClick={() => heroFileInputRef.current?.click()}
                        className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0f3f73] shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {heroUploading ? 'Uploading…' : 'Upload my photo'}
                      </button>
                      {heroUploadError ? (
                        <p className="mt-2 text-xs font-medium text-rose-600">{heroUploadError}</p>
                      ) : null}
                    </div>
                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <img
                        key={heroImageUrl.trim() || DEFAULT_HERO_BANNER_URL}
                        src={heroImageUrl.trim() || DEFAULT_HERO_BANNER_URL}
                        alt="Hero preview"
                        className="aspect-[21/9] min-h-[7rem] w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_HERO_BANNER_URL
                        }}
                      />
                    </div>
                  </section>
                </>
              )}

              {tab === 'content' && (
                <div className="space-y-6">
                  <section>
                    <h2 className="text-xs font-black uppercase tracking-wider text-[#0f3f73]">Business info</h2>
                    <div className="mt-3 space-y-3">
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500">Browser tab title</span>
                        <input
                          value={pageTitle}
                          onChange={(e) => setPageTitle(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#0f3f73]"
                          placeholder={`${(layout.businessName ?? '').trim() || merchantName || 'Your hotel'} · Book direct`}
                          maxLength={160}
                        />
                        <p className="mt-1 text-[10px] leading-snug text-slate-500">
                          Text guests see in the browser tab (e.g. instead of &ldquo;hofros - Booking Platform&rdquo;).
                          Leave blank to use business name + &ldquo;· Book direct&rdquo;.
                        </p>
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500">Business name</span>
                        <input
                          value={layout.businessName}
                          onChange={(e) => setLayout((p) => ({ ...p, businessName: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#0f3f73]"
                          placeholder="My Hotel"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500">Tagline</span>
                        <input
                          value={layout.businessTagline}
                          onChange={(e) => setLayout((p) => ({ ...p, businessTagline: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                          placeholder="Your home away from home"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500">Phone</span>
                        <input
                          value={layout.phone}
                          onChange={(e) => setLayout((p) => ({ ...p, phone: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="+1 234 567 8900"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500">Email</span>
                        <input
                          value={layout.email}
                          onChange={(e) => setLayout((p) => ({ ...p, email: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="contact@hotel.com"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500">Address</span>
                        <input
                          value={layout.address}
                          onChange={(e) => setLayout((p) => ({ ...p, address: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="123 Main St, City"
                        />
                      </label>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xs font-black uppercase tracking-wider text-[#0f3f73]">Hero</h2>
                    <label className="mt-3 block">
                      <span className="text-[11px] font-semibold text-slate-500">Hero title</span>
                      <input
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-[#0f3f73]"
                      />
                    </label>
                    <label className="mt-3 block">
                      <span className="text-[11px] font-semibold text-slate-500">Hero subtitle</span>
                      <textarea
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      />
                    </label>
                  </section>

                  <section>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-black uppercase tracking-wider text-[#0f3f73]">Amenities</h2>
                      <button
                        type="button"
                        onClick={addAmenity}
                        className="text-xs font-black text-blue-600 hover:text-blue-800"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={amenityDraft}
                        onChange={(e) => setAmenityDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs"
                        placeholder="New amenity"
                      />
                      <button
                        type="button"
                        onClick={addAmenity}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {layout.amenities.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-[#0f3f73]"
                        >
                          {a}
                          <button
                            type="button"
                            onClick={() => removeAmenity(a)}
                            className="ml-0.5 rounded-full p-0.5 text-slate-500 hover:bg-sky-200 hover:text-slate-800"
                            aria-label={`Remove ${a}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-black uppercase tracking-wider text-[#0f3f73]">Guest reviews</h2>
                      <button
                        type="button"
                        onClick={addReview}
                        className="text-xs font-black text-blue-600 hover:text-blue-800"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="mt-3 space-y-3">
                      {layout.reviews.map((r, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeReview(i)}
                              className="text-xs font-bold text-rose-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            value={r.name}
                            onChange={(e) => updateReview(i, 'name', e.target.value)}
                            className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-xs font-bold"
                            placeholder="Name"
                          />
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={r.rating}
                            onChange={(e) => updateReview(i, 'rating', e.target.value)}
                            className="mt-2 w-20 rounded border border-slate-200 px-2 py-1.5 text-xs"
                          />
                          <textarea
                            value={r.text}
                            onChange={(e) => updateReview(i, 'text', e.target.value)}
                            rows={2}
                            className="mt-2 w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                            placeholder="Review text"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {tab === 'sections' && (
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed text-slate-600">
                    Toggle sections to show or hide them on your booking website. Drag the handle to reorder blocks.
                  </p>
                  <ul className="space-y-2">
                    {layout.sectionOrder.map((id) => {
                      const def = SECTION_DEFS.find((s) => s.id === id)
                      if (!def) {
                        return null
                      }
                      const on = layout.sectionVisibility[id]
                      return (
                        <li
                          key={id}
                          draggable
                          onDragStart={() => setDragId(id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (dragId) {
                              moveSectionInOrder(dragId, id)
                            }
                            setDragId(null)
                          }}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                        >
                          <span className="cursor-grab text-slate-400 active:cursor-grabbing">
                            <DragHandleIcon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-[#0f3f73]">{def.title}</p>
                            <p className="text-[11px] text-slate-500">{def.subtitle}</p>
                          </div>
                          <SectionToggle checked={on} onChange={(v) => setSectionVisible(id, v)} />
                        </li>
                      )
                    })}
                  </ul>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#0f3f73]">Extra options</h3>
                    <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <label className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-[#0f3f73]">Show reviews</span>
                        <SectionToggle
                          checked={layout.showReviews}
                          onChange={(v) => setLayout((p) => ({ ...p, showReviews: v }))}
                        />
                      </label>
                      <label className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-[#0f3f73]">Show map</span>
                        <SectionToggle checked={layout.showMap} onChange={(v) => setLayout((p) => ({ ...p, showMap: v }))} />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col overflow-hidden bg-slate-300/40 p-4 md:p-6">
            <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Preview</p>
              <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`rounded-md px-3 py-1.5 ${previewMode === 'desktop' ? 'bg-[#0c2d5a] text-white' : 'text-slate-600'}`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`rounded-md px-3 py-1.5 ${previewMode === 'mobile' ? 'bg-[#0c2d5a] text-white' : 'text-slate-600'}`}
                >
                  Mobile
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 justify-center overflow-y-auto pb-8">
              <PortalPreview
                previewMode={previewMode}
                previewUrl={previewUrl}
                merchantName={merchantName}
                headline={headline}
                message={message}
                pageTitle={pageTitle}
                primaryColor={isValidHex(primaryColor) ? primaryColor : '#1B4F8A'}
                accentColor={isValidHex(accentColor) ? accentColor : '#F5A623'}
                heroImageUrl={heroImageUrl.trim() || DEFAULT_HERO_BANNER_URL}
                layout={layout}
                merchantSlug={merchantSlug}
                themePreset={themePreset}
                units={units}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DirectPortalDesignPage
