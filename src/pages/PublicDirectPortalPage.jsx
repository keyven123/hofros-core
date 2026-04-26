import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GuestPortalMicrosite from '../components/guestPortal/GuestPortalMicrosite'
import { apiFetch } from '../utils/api'
import { displayNameFromSlug } from '../utils/merchantSlug'
import { emptyGuestPortalLayout } from '../utils/guestPortalLayout'

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

function PublicDirectPortalPage() {
  const { merchantSlug } = useParams()
  const fallbackLabel = useMemo(() => displayNameFromSlug(merchantSlug ?? ''), [merchantSlug])

  const [loading, setLoading] = useState(true)
  const [notPublished, setNotPublished] = useState(false)
  const [error, setError] = useState(null)
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    let cancelled = false
    const slug = merchantSlug ?? ''

    async function run() {
      setLoading(true)
      setNotPublished(false)
      setError(null)
      try {
        const data = await apiFetch(`/v1/public/direct-portals/${encodeURIComponent(slug)}`)
        if (!cancelled) {
          setPayload(data)
        }
      } catch (e) {
        if (cancelled) {
          return
        }
        if (e instanceof Error && e.status === 404) {
          setNotPublished(true)
          setPayload(null)
        } else {
          setError(e instanceof Error ? e.message : 'Could not load portal.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [merchantSlug])

  const title = payload?.merchantName?.trim() || fallbackLabel
  const headline =
    typeof payload?.headline === 'string' && payload.headline.trim() ? payload.headline.trim() : `Book with ${title}`
  const blurb =
    typeof payload?.message === 'string' && payload.message.trim()
      ? payload.message.trim()
      : 'Choose a unit to continue — availability and checkout will connect here soon.'
  const primaryColor = typeof payload?.primaryColor === 'string' && payload.primaryColor ? payload.primaryColor : '#1B4F8A'
  const accentColor = typeof payload?.accentColor === 'string' && payload.accentColor ? payload.accentColor : '#F5A623'
  const heroUrl =
    typeof payload?.heroImageUrl === 'string' && payload.heroImageUrl.trim() ? payload.heroImageUrl.trim() : undefined
  const themePreset =
    typeof payload?.themePreset === 'string' && payload.themePreset.trim() ? payload.themePreset.trim() : 'bold_modern'
  const layout = useMemo(() => mergeLayoutFromApi(payload?.layout), [payload])
  const units = useMemo(() => (Array.isArray(payload?.units) ? payload.units : []), [payload])

  const guestDocumentTitle = useMemo(() => {
    if (!payload) {
      return 'hofros - Booking Platform'
    }
    const custom = typeof payload.pageTitle === 'string' ? payload.pageTitle.trim() : ''
    if (custom) {
      return custom
    }
    const brand =
      (layout.businessName ?? '').trim() || payload.merchantName?.trim() || fallbackLabel.trim() || ''
    return brand ? `${brand} · Book direct` : 'Book direct'
  }, [payload, layout.businessName, fallbackLabel])

  useEffect(() => {
    if (loading || error || notPublished || !payload) {
      return undefined
    }
    const previous = document.title
    document.title = guestDocumentTitle
    return () => {
      document.title = previous
    }
  }, [loading, error, notPublished, payload, guestDocumentTitle])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
        Loading booking page…
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white px-4 py-16 text-center">
        <p className="text-sm text-rose-700">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-blue-600 hover:text-blue-800">
          hofros home
        </Link>
      </div>
    )
  }

  if (notPublished || !payload) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#fffbeb] to-[#eff6ff] px-4 py-16 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-white/90 p-8 shadow-sm">
          <h1 className="text-lg font-black text-[#0f3f73]">Not published yet</h1>
          <p className="mt-2 text-sm text-slate-600">
            This direct booking link is in testing or has not been switched live by the property yet.
          </p>
          <p className="mt-4 font-mono text-xs text-slate-500">/{merchantSlug}/directportal</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            hofros home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <GuestPortalMicrosite
      layout={layout}
      headline={headline}
      message={blurb}
      primaryColor={primaryColor}
      accentColor={accentColor}
      heroImageUrl={heroUrl}
      merchantNameFallback={title}
      slug={merchantSlug}
      themePreset={themePreset}
      units={units}
      LinkComponent={Link}
      linkHomeProps={{ to: '/' }}
      bookTo={(id) => `/${merchantSlug}/directportal/book/${id}`}
    />
  )
}

export default PublicDirectPortalPage
