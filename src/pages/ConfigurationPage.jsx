import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch, resolvePublicStorageUrl } from '../utils/api'
import { getApiToken, getMerchantSession } from '../utils/auth'

const TABS = [
  { id: 'property', label: 'Accommodation', icon: 'building' },
  { id: 'units', label: 'Rooms/Units', icon: 'house' },
  { id: 'rates', label: 'Availability / Base Rates', icon: 'sliders' },
  { id: 'schedule', label: 'Unit Schedule', icon: 'calendar' },
  { id: 'alerts', label: 'Alerts', icon: 'bell' },
  { id: 'access', label: 'Access', icon: 'shield' },
]

const MAX_UNIT_IMAGES = 20
const ALL_ACCOMMODATION_TYPES_KEY = '__all__'
const PRESET_UNIT_TYPES = ['Apartment', 'Studio', 'Suite', 'Deluxe']
const UNIT_TYPE_OTHER_VALUE = '__other__'

const WEEK_SCHEDULE_DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

/** Sun-first labels for rate interval day pickers and table display. */
const INTERVAL_DAY_ORDER = [
  { key: 'sun', label: 'Sun' },
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
]

function defaultIntervalDays() {
  return {
    sun: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
  }
}

function formatLosDisplay(value) {
  if (value == null || value === '') {
    return 'None'
  }
  const n = Number(value)
  if (!Number.isFinite(n)) {
    return String(value)
  }
  return `${n} night${n === 1 ? '' : 's'}`
}

function formatDateDdMmYyyy(iso) {
  if (!iso || typeof iso !== 'string') {
    return '—'
  }
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return iso
  }
  const [y, m, d] = parts
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatIntervalDaysList(days) {
  if (!days || typeof days !== 'object') {
    return '—'
  }
  const parts = []
  for (const { key, label } of INTERVAL_DAY_ORDER) {
    if (days[key]) {
      parts.push(label)
    }
  }
  return parts.length ? parts.join(', ') : '—'
}

function rateCurrencySymbol(code) {
  if (code === 'EUR') return '€'
  if (code === 'USD') return '$'
  if (code === 'GBP') return '£'
  if (code === 'PHP') return '₱'
  return `${code} `
}

function formatIntervalRatesSummary(interval) {
  if (!interval?.currency) {
    return '—'
  }
  const sym = rateCurrencySymbol(interval.currency)
  const days = interval.daysOfWeek || {}
  const activePrices = INTERVAL_DAY_ORDER.filter(({ key }) => days[key]).map(({ key }) => Number(interval.dayPrices?.[key] ?? 0))
  if (activePrices.length === 0) {
    return `${sym}0`
  }
  const min = Math.min(...activePrices)
  const max = Math.max(...activePrices)
  const fmt = (n) =>
    n.toLocaleString(undefined, { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })
  if (min === max) {
    return `${sym}${fmt(min)}`
  }
  return `${sym}${fmt(min)} – ${fmt(max)}`
}

function defaultDayPriceStrings() {
  const o = {}
  for (const { key } of INTERVAL_DAY_ORDER) {
    o[key] = '0'
  }
  return o
}

function emptyRateIntervalForm(currency = 'PHP') {
  const today = new Date()
  const end = new Date(today)
  end.setMonth(end.getMonth() + 1)
  const toYmd = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return {
    name: '',
    startDate: toYmd(today),
    endDate: toYmd(end),
    minLos: '',
    maxLos: '',
    closedToArrival: false,
    closedToDeparture: false,
    daysOfWeek: defaultIntervalDays(),
    dayPrices: defaultDayPriceStrings(),
    bulkDayPrice: '0',
    currency,
  }
}

const priceInputClass = (value) =>
  `w-full rounded border border-slate-200 py-1.5 placeholder:text-slate-400 focus:text-slate-900 ${
    value === '0' ? 'text-slate-400' : 'text-slate-900'
  }`

function intervalRowToForm(row) {
  const dayPrices = defaultDayPriceStrings()
  if (row.dayPrices && typeof row.dayPrices === 'object') {
    for (const { key } of INTERVAL_DAY_ORDER) {
      if (row.dayPrices[key] != null && row.dayPrices[key] !== '') {
        dayPrices[key] = String(row.dayPrices[key])
      }
    }
  } else if (row.basePrice != null) {
    const bp = String(row.basePrice)
    for (const { key } of INTERVAL_DAY_ORDER) {
      dayPrices[key] = row.daysOfWeek?.[key] ? bp : '0'
    }
  }
  return {
    name: row.name ?? '',
    startDate: row.startDate ?? '',
    endDate: row.endDate ?? '',
    minLos: row.minLos != null && row.minLos !== 0 ? String(row.minLos) : '',
    maxLos: row.maxLos != null && row.maxLos !== 0 ? String(row.maxLos) : '',
    closedToArrival: Boolean(row.closedToArrival),
    closedToDeparture: Boolean(row.closedToDeparture),
    daysOfWeek: { ...defaultIntervalDays(), ...(row.daysOfWeek || {}) },
    dayPrices,
    bulkDayPrice: '0',
    currency: row.currency || 'PHP',
  }
}

function defaultWeekSchedule() {
  return {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: true,
  }
}

function normalizeWeekSchedule(raw) {
  const next = defaultWeekSchedule()
  if (!raw || typeof raw !== 'object') {
    return next
  }
  for (const { key } of WEEK_SCHEDULE_DAYS) {
    if (typeof raw[key] === 'boolean') {
      next[key] = raw[key]
    }
  }
  return next
}

const CURRENCY_OPTIONS = [
  { value: 'PHP', label: 'PHP (₱)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
]

/** Display API time `HH:mm` (24h) like `2:00 pm` for listings. */
function formatTime12h(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') {
    return '—'
  }
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!match) {
    return hhmm
  }
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    return hhmm
  }
  const date = new Date(2000, 0, 1, hours, minutes)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 21v-8H7v8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 3v5h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TabIcon({ type }) {
  const common = 'h-[18px] w-[18px] shrink-0 stroke-[1.75]'
  const stroke = { strokeLinecap: 'round', strokeLinejoin: 'round' }

  if (type === 'building') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M3 21h18" />
        <path d="M6 21V8l6-4 6 4v13" />
        <path d="M9 21v-4h6v4" />
        <path d="M9 12h2" />
        <path d="M13 12h2" />
        <path d="M9 16h2" />
        <path d="M13 16h2" />
      </svg>
    )
  }

  if (type === 'house') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5.5 9.5V20a1 1 0 0 0 1 1h4v-7h3v7h4a1 1 0 0 0 1-1V9.5" />
      </svg>
    )
  }

  if (type === 'bell') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 14h18c0-7-3-7-3-14" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  }

  if (type === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    )
  }

  if (type === 'shield') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    )
  }

  if (type === 'sliders') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={common} aria-hidden="true" {...stroke}>
        <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 16V3" />
        <path d="M2 8h4M10 16h4M18 12h4" strokeLinecap="round" />
      </svg>
    )
  }

  return null
}

function FieldHint({ title }) {
  return (
    <span className="ml-0.5 inline-flex align-middle text-slate-400" title={title}>
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
        checked ? 'border-blue-500 bg-blue-500' : 'border-slate-200 bg-slate-200'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

const emptyProperty = {
  propertyName: '',
  contactEmail: '',
  phone: '',
  address: '',
  currency: 'PHP',
  checkInTime: '14:00',
  checkOutTime: '11:00',
}

const emptyNotifications = {
  newBooking: true,
  cancellation: true,
  checkIn: true,
  checkOut: false,
  payment: true,
  review: false,
}

function formatRole(role) {
  if (!role) return ''
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

function mapApiUnitToForm(unit, propertiesList) {
  const fallbackPropertyId = propertiesList[0]?.id != null ? String(propertiesList[0].id) : ''
  return {
    propertyId:
      unit.propertyId != null && unit.propertyId !== '' ? String(unit.propertyId) : fallbackPropertyId,
    name: unit.name ?? '',
    details: unit.details ?? '',
    description: unit.description ?? '',
    images: Array.isArray(unit.images) ? [...unit.images] : [],
    type: unit.type ?? '',
    maxGuests: unit.maxGuests ?? 2,
    bedrooms: unit.bedrooms ?? 1,
    beds: unit.beds ?? 1,
    status: unit.status ?? 'active',
  }
}

/** Build POST body for creating an interval from an API interval row (copy). */
function intervalToCreatePayload(interval) {
  const dayPrices = {}
  for (const { key } of INTERVAL_DAY_ORDER) {
    dayPrices[key] = Number(interval.dayPrices?.[key] ?? 0)
  }
  return {
    name: typeof interval.name === 'string' && interval.name.trim() ? interval.name.trim() : null,
    startDate: interval.startDate,
    endDate: interval.endDate,
    minLos: interval.minLos ?? null,
    maxLos: interval.maxLos ?? null,
    closedToArrival: Boolean(interval.closedToArrival),
    closedToDeparture: Boolean(interval.closedToDeparture),
    daysOfWeek: interval.daysOfWeek,
    dayPrices,
    currency: interval.currency,
  }
}

function ConfigurationPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = TABS.some((tab) => tab.id === tabParam) ? tabParam : 'property'

  const [apiReady, setApiReady] = useState(Boolean(getApiToken()))

  const [banner, setBanner] = useState('')
  const [error, setError] = useState('')

  const [properties, setProperties] = useState([])
  const [units, setUnits] = useState([])
  const [notifications, setNotifications] = useState(emptyNotifications)
  const [team, setTeam] = useState([])

  const [loadingAll, setLoadingAll] = useState(true)
  const [savingPropertyModal, setSavingPropertyModal] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)

  const [propertyModal, setPropertyModal] = useState({ open: false, mode: 'create', id: null })
  const [propertyForm, setPropertyForm] = useState(emptyProperty)

  const [unitModal, setUnitModal] = useState({ open: false, mode: 'create', unit: null })
  const [unitForm, setUnitForm] = useState({
    propertyId: '',
    name: '',
    details: '',
    description: '',
    images: [],
    type: 'Apartment',
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    status: 'active',
  })
  const [savingUnitModal, setSavingUnitModal] = useState(false)
  const [pendingUnitImageFiles, setPendingUnitImageFiles] = useState([])
  const [pendingImagePreviewUrls, setPendingImagePreviewUrls] = useState([])
  const [isCustomUnitType, setIsCustomUnitType] = useState(false)
  const [customUnitTypeInput, setCustomUnitTypeInput] = useState('')
  const [unitsPropertyId, setUnitsPropertyId] = useState(ALL_ACCOMMODATION_TYPES_KEY)

  const [ratesPropertyId, setRatesPropertyId] = useState(null)
  const [ratesUnitId, setRatesUnitId] = useState(null)
  const [rateIntervals, setRateIntervals] = useState([])
  const [loadingRateIntervals, setLoadingRateIntervals] = useState(false)
  const [rateIntervalModal, setRateIntervalModal] = useState({ open: false, mode: 'create', unitId: null, interval: null })
  const [rateIntervalForm, setRateIntervalForm] = useState(() => emptyRateIntervalForm())
  const [savingRateInterval, setSavingRateInterval] = useState(false)
  const [copyIntervalsOpen, setCopyIntervalsOpen] = useState(false)
  const [copyIntervalsSourceUnitId, setCopyIntervalsSourceUnitId] = useState('')
  const [copyIntervalsReplace, setCopyIntervalsReplace] = useState(false)
  const [copyingIntervals, setCopyingIntervals] = useState(false)
  const [copySourceIntervals, setCopySourceIntervals] = useState([])
  const [copySourceIntervalsLoading, setCopySourceIntervalsLoading] = useState(false)
  const [copySelectedIntervalIds, setCopySelectedIntervalIds] = useState([])

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'staff' })

  const [scheduleDrafts, setScheduleDrafts] = useState({})
  const [savingScheduleUnitId, setSavingScheduleUnitId] = useState(null)

  const otherUnitsForCopy = useMemo(() => {
    if (ratesUnitId == null) {
      return []
    }
    return units
      .filter((u) => u.id !== ratesUnitId)
      .slice()
      .sort((a, b) => {
        const pa = String(a.propertyName || '').localeCompare(String(b.propertyName || ''), undefined, {
          sensitivity: 'base',
        })
        if (pa !== 0) {
          return pa
        }
        return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
      })
  }, [units, ratesUnitId])

  const unitTypeOptions = useMemo(() => {
    const lowerPreset = new Set(PRESET_UNIT_TYPES.map((value) => value.toLowerCase()))
    const custom = []
    const seen = new Set()
    for (const row of units) {
      const raw = typeof row.type === 'string' ? row.type.trim() : ''
      if (!raw) {
        continue
      }
      const key = raw.toLowerCase()
      if (lowerPreset.has(key) || seen.has(key)) {
        continue
      }
      seen.add(key)
      custom.push(raw)
    }
    custom.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    return [...PRESET_UNIT_TYPES, ...custom]
  }, [units])

  const selectedUnitTypeValue = useMemo(() => {
    if (isCustomUnitType) {
      return UNIT_TYPE_OTHER_VALUE
    }
    const raw = typeof unitForm.type === 'string' ? unitForm.type.trim() : ''
    if (!raw) {
      return ''
    }
    const match = unitTypeOptions.find((option) => option.toLowerCase() === raw.toLowerCase())
    return match ?? UNIT_TYPE_OTHER_VALUE
  }, [isCustomUnitType, unitForm.type, unitTypeOptions])

  const refreshConfiguration = useCallback(async () => {
    if (!getApiToken()) {
      setApiReady(false)
      setLoadingAll(false)
      return
    }

    setError('')
    setLoadingAll(true)
    try {
      const [propertiesData, unitsData, notificationsData, teamData] = await Promise.all([
        apiFetch('/v1/configuration/properties'),
        apiFetch('/v1/configuration/units'),
        apiFetch('/v1/configuration/notifications'),
        apiFetch('/v1/configuration/team'),
      ])

      setProperties(Array.isArray(propertiesData.properties) ? propertiesData.properties : [])
      setUnits(Array.isArray(unitsData.units) ? unitsData.units : [])
      setNotifications({ ...emptyNotifications, ...notificationsData })
      setTeam(Array.isArray(teamData.team) ? teamData.team : [])
      setApiReady(true)
    } catch (requestError) {
      if (requestError.status === 401) {
        setApiReady(false)
        setError('Your session has expired. Sign out and sign in again.')
      } else {
        setError(requestError.message || 'Could not load configuration.')
      }
    } finally {
      setLoadingAll(false)
    }
  }, [])

  useEffect(() => {
    void refreshConfiguration()
  }, [refreshConfiguration])

  useEffect(() => {
    const urls = pendingUnitImageFiles.map((file) => URL.createObjectURL(file))
    setPendingImagePreviewUrls(urls)
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url)
      }
    }
  }, [pendingUnitImageFiles])

  useEffect(() => {
    if (properties.length === 0) {
      setRatesPropertyId(null)
      return
    }
    setRatesPropertyId((previous) => {
      if (previous != null && properties.some((p) => String(p.id) === String(previous))) {
        return previous
      }
      return String(properties[0].id)
    })
  }, [properties])

  useEffect(() => {
    if (properties.length === 0) {
      setUnitsPropertyId(ALL_ACCOMMODATION_TYPES_KEY)
      return
    }
    setUnitsPropertyId((previous) => {
      if (previous === ALL_ACCOMMODATION_TYPES_KEY) {
        return previous
      }
      if (properties.some((propertyRow) => String(propertyRow.id) === String(previous))) {
        return previous
      }
      return ALL_ACCOMMODATION_TYPES_KEY
    })
  }, [properties])

  useEffect(() => {
    if (ratesPropertyId == null) {
      setRatesUnitId(null)
      return
    }
    const list = units.filter((u) => String(u.propertyId) === String(ratesPropertyId))
    if (list.length === 0) {
      setRatesUnitId(null)
      return
    }
    setRatesUnitId((previous) => {
      if (previous != null && list.some((u) => u.id === previous)) {
        return previous
      }
      return list[0].id
    })
  }, [units, ratesPropertyId])

  useEffect(() => {
    if (activeTab !== 'rates' || ratesUnitId == null || !getApiToken()) {
      return
    }
    let cancelled = false
    setLoadingRateIntervals(true)
    setError('')
    void apiFetch(`/v1/configuration/units/${ratesUnitId}/rate-intervals`)
      .then((data) => {
        if (!cancelled) {
          setRateIntervals(Array.isArray(data.intervals) ? data.intervals : [])
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setRateIntervals([])
          setError(requestError.message || 'Could not load rate intervals.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRateIntervals(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [activeTab, ratesUnitId])

  useEffect(() => {
    setCopyIntervalsOpen(false)
    setCopyIntervalsSourceUnitId('')
    setCopyIntervalsReplace(false)
    setCopySourceIntervals([])
    setCopySelectedIntervalIds([])
  }, [ratesUnitId, activeTab])

  useEffect(() => {
    if (!copyIntervalsSourceUnitId || !getApiToken()) {
      setCopySourceIntervals([])
      setCopySelectedIntervalIds([])
      setCopySourceIntervalsLoading(false)
      return
    }
    const sourceId = Number(copyIntervalsSourceUnitId)
    if (!Number.isFinite(sourceId)) {
      setCopySourceIntervals([])
      setCopySelectedIntervalIds([])
      return
    }
    let cancelled = false
    setCopySourceIntervalsLoading(true)
    setError('')
    void apiFetch(`/v1/configuration/units/${sourceId}/rate-intervals`)
      .then((data) => {
        if (cancelled) {
          return
        }
        const list = Array.isArray(data.intervals) ? data.intervals : []
        setCopySourceIntervals(list)
        setCopySelectedIntervalIds(list.map((row) => row.id))
      })
      .catch((requestError) => {
        if (!cancelled) {
          setCopySourceIntervals([])
          setCopySelectedIntervalIds([])
          setError(requestError.message || 'Could not load intervals for the selected unit.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCopySourceIntervalsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [copyIntervalsSourceUnitId])

  useEffect(() => {
    if (activeTab !== 'schedule') {
      return
    }
    setScheduleDrafts(() => {
      const next = {}
      for (const unit of units) {
        next[unit.id] = normalizeWeekSchedule(unit.weekSchedule)
      }
      return next
    })
  }, [activeTab, units])

  function setTab(next) {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    setSearchParams(params, { replace: true })
  }

  function openAddProperty() {
    setPropertyForm({ ...emptyProperty })
    setPropertyModal({ open: true, mode: 'create', id: null })
  }

  function openEditProperty(row) {
    setPropertyForm({
      propertyName: row.propertyName ?? '',
      contactEmail: row.contactEmail ?? '',
      phone: row.phone ?? '',
      address: row.address ?? '',
      currency: 'PHP',
      checkInTime: row.checkInTime ?? '14:00',
      checkOutTime: row.checkOutTime ?? '11:00',
    })
    setPropertyModal({ open: true, mode: 'edit', id: row.id })
  }

  async function handleSavePropertyModal(event) {
    event.preventDefault()
    if (!getApiToken()) {
      setError('Sign in with your hofros account to save accommodations.')
      return
    }
    setSavingPropertyModal(true)
    setError('')
    const propertyPayload = { ...propertyForm, currency: 'PHP' }
    try {
      if (propertyModal.mode === 'create') {
        await apiFetch('/v1/configuration/properties', {
          method: 'POST',
          body: JSON.stringify(propertyPayload),
        })
      } else if (propertyModal.id != null) {
        await apiFetch(`/v1/configuration/properties/${propertyModal.id}`, {
          method: 'PUT',
          body: JSON.stringify(propertyPayload),
        })
      }
      setPropertyModal({ open: false, mode: 'create', id: null })
      await refreshConfiguration()
      setBanner(propertyModal.mode === 'create' ? 'Accommodation added.' : 'Accommodation updated.')
      window.setTimeout(() => setBanner(''), 3200)
    } catch (requestError) {
      setError(requestError.message || 'Save failed.')
    } finally {
      setSavingPropertyModal(false)
    }
  }

  function toggleScheduleDay(unitId, dayKey) {
    setScheduleDrafts((previous) => {
      const unitRow = units.find((u) => u.id === unitId)
      const base = previous[unitId] ?? normalizeWeekSchedule(unitRow?.weekSchedule)
      return {
        ...previous,
        [unitId]: { ...base, [dayKey]: !base[dayKey] },
      }
    })
  }

  async function handleSaveUnitSchedule(unitId) {
    const draft = scheduleDrafts[unitId]
    if (!draft || !getApiToken()) {
      if (!getApiToken()) {
        setError('Sign in with your hofros account to save schedules.')
      }
      return
    }
    setSavingScheduleUnitId(unitId)
    setError('')
    try {
      await apiFetch(`/v1/configuration/units/${unitId}/week-schedule`, {
        method: 'PATCH',
        body: JSON.stringify({ weekSchedule: draft }),
      })
      await refreshConfiguration()
      setBanner('Unit schedule saved.')
      window.setTimeout(() => setBanner(''), 2800)
    } catch (requestError) {
      setError(requestError.message || 'Could not save schedule.')
    } finally {
      setSavingScheduleUnitId(null)
    }
  }

  async function handleDeleteProperty(row) {
    if (!window.confirm(`Delete accommodation “${row.propertyName}”?`)) {
      return
    }
    try {
      await apiFetch(`/v1/configuration/properties/${row.id}`, { method: 'DELETE' })
      await refreshConfiguration()
      setBanner('Accommodation removed.')
      window.setTimeout(() => setBanner(''), 3200)
    } catch (requestError) {
      setError(requestError.message || 'Could not delete accommodation.')
    }
  }

  async function handleSaveNotifications(event) {
    event.preventDefault()
    if (!getApiToken()) {
      setError('Sign in with your hofros account to save notification preferences.')
      return
    }
    setSavingNotifications(true)
    setError('')
    try {
      const updated = await apiFetch('/v1/configuration/notifications', {
        method: 'PUT',
        body: JSON.stringify(notifications),
      })
      setNotifications({ ...emptyNotifications, ...updated })
      setBanner('Notification preferences saved.')
      window.setTimeout(() => setBanner(''), 3200)
    } catch (requestError) {
      setError(requestError.message || 'Save failed.')
    } finally {
      setSavingNotifications(false)
    }
  }

  function closeUnitModal() {
    setPendingUnitImageFiles([])
    setIsCustomUnitType(false)
    setCustomUnitTypeInput('')
    setUnitModal({ open: false, mode: 'create', unit: null })
  }

  function openCreateUnit() {
    const firstPropertyId = properties[0]?.id != null ? String(properties[0].id) : ''
    setUnitForm({
      propertyId: firstPropertyId,
      name: '',
      details: '',
      description: '',
      images: [],
      type: 'Apartment',
      maxGuests: 2,
      bedrooms: 1,
      beds: 1,
      status: 'active',
    })
    setIsCustomUnitType(false)
    setCustomUnitTypeInput('')
    setPendingUnitImageFiles([])
    setUnitModal({ open: true, mode: 'create', unit: null })
  }

  function openEditUnit(unit) {
    const mapped = mapApiUnitToForm(unit, properties)
    const rawType = typeof mapped.type === 'string' ? mapped.type.trim() : ''
    const isKnown = rawType
      ? unitTypeOptions.some((option) => option.toLowerCase() === rawType.toLowerCase())
      : false
    setUnitForm(mapped)
    setIsCustomUnitType(Boolean(rawType) && !isKnown)
    setCustomUnitTypeInput(Boolean(rawType) && !isKnown ? rawType : '')
    setPendingUnitImageFiles([])
    setUnitModal({ open: true, mode: 'edit', unit })
  }

  function handleUnitImageFilesSelected(event) {
    const input = event.target
    const picked = input.files ? Array.from(input.files) : []
    input.value = ''
    if (picked.length === 0) {
      return
    }
    const existingCount = (Array.isArray(unitForm.images) ? unitForm.images.length : 0) + pendingUnitImageFiles.length
    const room = Math.max(0, MAX_UNIT_IMAGES - existingCount)
    if (room <= 0) {
      return
    }
    const next = picked.slice(0, room)
    setPendingUnitImageFiles((previous) => [...previous, ...next])
  }

  async function handleSaveUnit(event) {
    event.preventDefault()
    if (!getApiToken()) {
      setError('Sign in with your hofros account to save rooms/units.')
      return
    }
    if (!unitForm.propertyId) {
      setError('Select the accommodation this room/unit belongs to.')
      return
    }
    const unitTypeTrim = typeof unitForm.type === 'string' ? unitForm.type.trim() : ''
    if (!unitTypeTrim) {
      setError('Select a unit type. If you choose Others, enter your custom type.')
      return
    }
    const detailsTrim = unitForm.details.trim()
    const descriptionTrim = unitForm.description.trim()
    const imageUrls = Array.isArray(unitForm.images) ? unitForm.images : []
    const payload = {
      propertyId: Number(unitForm.propertyId),
      name: unitForm.name.trim(),
      details: detailsTrim === '' ? null : detailsTrim,
      description: descriptionTrim === '' ? null : descriptionTrim,
      images: imageUrls,
      type: unitTypeTrim,
      maxGuests: Number(unitForm.maxGuests),
      bedrooms: Number(unitForm.bedrooms),
      beds: Number(unitForm.beds),
      status: unitForm.status,
    }

    setSavingUnitModal(true)
    setError('')
    try {
      let unitId
      if (unitModal.mode === 'create') {
        const created = await apiFetch('/v1/configuration/units', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        unitId = created.id
        setUnitModal({ open: true, mode: 'edit', unit: created })
        setUnitForm(mapApiUnitToForm(created, properties))
      } else if (unitModal.unit) {
        unitId = unitModal.unit.id
        const updated = await apiFetch(`/v1/configuration/units/${unitModal.unit.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setUnitModal((previous) => ({ ...previous, unit: updated }))
        setUnitForm(mapApiUnitToForm(updated, properties))
      } else {
        return
      }

      if (pendingUnitImageFiles.length > 0) {
        const formData = new FormData()
        for (const file of pendingUnitImageFiles) {
          formData.append('images[]', file)
        }
        const withImages = await apiFetch(`/v1/configuration/units/${unitId}/images`, {
          method: 'POST',
          body: formData,
        })
        setUnitModal((previous) => ({ ...previous, unit: withImages }))
        setUnitForm(mapApiUnitToForm(withImages, properties))
        setPendingUnitImageFiles([])
      }

      closeUnitModal()
      await refreshConfiguration()
      setBanner('Rooms/units updated.')
      window.setTimeout(() => setBanner(''), 3200)
    } catch (requestError) {
      setError(requestError.message || 'Could not save room/unit.')
      await refreshConfiguration()
    } finally {
      setSavingUnitModal(false)
    }
  }

  async function handleDeleteUnit(unit) {
    if (!window.confirm(`Delete ${unit.name}?`)) {
      return
    }
    try {
      await apiFetch(`/v1/configuration/units/${unit.id}`, { method: 'DELETE' })
      await refreshConfiguration()
      setBanner('Unit removed.')
      window.setTimeout(() => setBanner(''), 3200)
    } catch (requestError) {
      setError(requestError.message || 'Could not delete room/unit.')
    }
  }

  function closeRateIntervalModal() {
    setRateIntervalModal({ open: false, mode: 'create', unitId: null, interval: null })
  }

  function openCreateRateInterval() {
    if (ratesUnitId == null) {
      return
    }
    const unitRow = units.find((u) => u.id === ratesUnitId)
    const propertyRow = properties.find((p) => p.id == null ? false : String(p.id) === String(unitRow?.propertyId))
    const currency = propertyRow?.currency || 'PHP'
    setRateIntervalForm(emptyRateIntervalForm(currency))
    setRateIntervalModal({ open: true, mode: 'create', unitId: ratesUnitId, interval: null })
  }

  function openEditRateInterval(interval) {
    if (ratesUnitId == null) {
      return
    }
    setRateIntervalForm(intervalRowToForm(interval))
    setRateIntervalModal({ open: true, mode: 'edit', unitId: ratesUnitId, interval })
  }

  async function handleSaveRateInterval(event) {
    event.preventDefault()
    if (!getApiToken() || rateIntervalModal.unitId == null) {
      return
    }
    const unitId = rateIntervalModal.unitId
    const dayPrices = {}
    for (const { key } of INTERVAL_DAY_ORDER) {
      dayPrices[key] = Number(rateIntervalForm.dayPrices[key] ?? 0)
    }
    const parseLosField = (raw) => {
      if (raw === '' || raw === '0') return null
      const n = Number(raw)
      if (!Number.isFinite(n)) return null
      const nights = Math.round(n)
      if (nights < 1) return null
      return Math.min(365, nights)
    }
    const minLosRaw = parseLosField(rateIntervalForm.minLos)
    const maxLosRaw = parseLosField(rateIntervalForm.maxLos)
    const payload = {
      name: rateIntervalForm.name.trim() === '' ? null : rateIntervalForm.name.trim(),
      startDate: rateIntervalForm.startDate,
      endDate: rateIntervalForm.endDate,
      minLos: minLosRaw,
      maxLos: maxLosRaw,
      closedToArrival: Boolean(rateIntervalForm.closedToArrival),
      closedToDeparture: Boolean(rateIntervalForm.closedToDeparture),
      daysOfWeek: rateIntervalForm.daysOfWeek,
      dayPrices,
      currency: rateIntervalForm.currency,
    }
    setSavingRateInterval(true)
    setError('')
    try {
      if (rateIntervalModal.mode === 'create') {
        await apiFetch(`/v1/configuration/units/${unitId}/rate-intervals`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } else if (rateIntervalModal.interval) {
        await apiFetch(`/v1/configuration/units/${unitId}/rate-intervals/${rateIntervalModal.interval.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      }
      closeRateIntervalModal()
      const data = await apiFetch(`/v1/configuration/units/${unitId}/rate-intervals`)
      setRateIntervals(Array.isArray(data.intervals) ? data.intervals : [])
      setBanner('Rate interval saved.')
      window.setTimeout(() => setBanner(''), 2800)
    } catch (requestError) {
      setError(requestError.message || 'Could not save interval.')
    } finally {
      setSavingRateInterval(false)
    }
  }

  async function handleDeleteRateInterval(interval) {
    if (ratesUnitId == null || !window.confirm('Delete this interval?')) {
      return
    }
    try {
      await apiFetch(`/v1/configuration/units/${ratesUnitId}/rate-intervals/${interval.id}`, { method: 'DELETE' })
      const data = await apiFetch(`/v1/configuration/units/${ratesUnitId}/rate-intervals`)
      setRateIntervals(Array.isArray(data.intervals) ? data.intervals : [])
      setBanner('Interval removed.')
      window.setTimeout(() => setBanner(''), 2800)
    } catch (requestError) {
      setError(requestError.message || 'Could not delete interval.')
    }
  }

  async function handleCopyIntervalsFromUnit() {
    if (ratesUnitId == null) {
      return
    }
    if (!copyIntervalsSourceUnitId) {
      setError('Choose a room/unit to copy intervals from.')
      return
    }
    const sourceId = Number(copyIntervalsSourceUnitId)
    if (!Number.isFinite(sourceId) || sourceId === ratesUnitId) {
      setError('Select a different room/unit.')
      return
    }
    const idSet = new Set(copySelectedIntervalIds)
    const intervalsToCopy = copySourceIntervals.filter((row) => idSet.has(row.id))
    if (intervalsToCopy.length === 0) {
      setError('Select at least one interval to copy.')
      return
    }
    if (copyIntervalsReplace && rateIntervals.length > 0) {
      if (
        !window.confirm(
          `Replace all ${rateIntervals.length} interval(s) on this unit with ${intervalsToCopy.length} copied interval(s)? Existing intervals will be deleted.`,
        )
      ) {
        return
      }
    }
    setCopyingIntervals(true)
    setError('')
    try {
      if (copyIntervalsReplace && rateIntervals.length > 0) {
        for (const row of [...rateIntervals]) {
          await apiFetch(`/v1/configuration/units/${ratesUnitId}/rate-intervals/${row.id}`, { method: 'DELETE' })
        }
      }
      let copied = 0
      let firstError = ''
      for (const interval of intervalsToCopy) {
        try {
          await apiFetch(`/v1/configuration/units/${ratesUnitId}/rate-intervals`, {
            method: 'POST',
            body: JSON.stringify(intervalToCreatePayload(interval)),
          })
          copied += 1
        } catch (requestError) {
          firstError = requestError.message || 'Copy failed for one interval.'
          break
        }
      }
      const refreshed = await apiFetch(`/v1/configuration/units/${ratesUnitId}/rate-intervals`)
      setRateIntervals(Array.isArray(refreshed.intervals) ? refreshed.intervals : [])
      setCopyIntervalsOpen(false)
      setCopyIntervalsSourceUnitId('')
      setCopyIntervalsReplace(false)
      setCopySourceIntervals([])
      setCopySelectedIntervalIds([])
      if (firstError) {
        setError(`${firstError} (${copied} of ${intervalsToCopy.length} copied.)`)
      } else {
        setBanner(`Copied ${copied} interval${copied === 1 ? '' : 's'}.`)
        window.setTimeout(() => setBanner(''), 3200)
      }
    } catch (requestError) {
      setError(requestError.message || 'Could not copy intervals.')
    } finally {
      setCopyingIntervals(false)
    }
  }

  async function handleRoleChange(member, role) {
    try {
      await apiFetch(`/v1/configuration/team/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      await refreshConfiguration()
      setBanner('Team role updated.')
      window.setTimeout(() => setBanner(''), 3200)
    } catch (requestError) {
      setError(requestError.message || requestError.body?.message || 'Could not update role.')
    }
  }

  async function handleInvite(event) {
    event.preventDefault()
    try {
      await apiFetch('/v1/configuration/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteForm.email.trim(),
          name: inviteForm.name.trim() || undefined,
          role: inviteForm.role,
        }),
      })
      setInviteOpen(false)
      setInviteForm({ email: '', name: '', role: 'staff' })
      await refreshConfiguration()
      setBanner('Invitation recorded.')
      window.setTimeout(() => setBanner(''), 3200)
    } catch (requestError) {
      setError(requestError.message || requestError.body?.message || 'Invite failed.')
    }
  }

  const disableActions = !apiReady || loadingAll
  const propertyListLoading = loadingAll
  const filteredUnits =
    unitsPropertyId === ALL_ACCOMMODATION_TYPES_KEY
      ? units
      : units.filter((unit) => String(unit.propertyId) === String(unitsPropertyId))

  return (
    <div className="p-4 lg:p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-[#0f3f73]">Configuration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage accommodations, rooms/units, alerts, and team access.
        </p>
      </header>

      {banner && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {banner}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-white text-[#0f3f73] shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
              }`}
            >
              <TabIcon type={tab.icon} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <section className="mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        {loadingAll ? (
          <p className="text-sm font-semibold text-slate-500">Loading configuration…</p>
        ) : (
          <>
            {activeTab === 'property' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#0f3f73]">Accommodation</h2>
                  <button
                    type="button"
                    onClick={openAddProperty}
                    disabled={propertyListLoading}
                    className="rounded-lg bg-[#2b5aed] px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2147c7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    + Add accommodation
                  </button>
                </div>

                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {properties.length === 0 && (
                    <p className="px-3 py-6 text-sm text-slate-500">
                      No accommodations yet. Click{' '}
                      <button
                        type="button"
                        onClick={openAddProperty}
                        disabled={propertyListLoading}
                        className="font-semibold text-[#2b5aed] underline decoration-blue-200 underline-offset-2 transition hover:text-[#2147c7] disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                      >
                        Add accommodation
                      </button>{' '}
                      to enter name, contact email, phone, address, currency (PHP), and check-in / check-out times.
                    </p>
                  )}
                  {properties.map((row) => (
                    <div key={row.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eff7ff] text-[#2b5aed] ring-1 ring-blue-100">
                          <TabIcon type="building" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0f3f73]">
                            {row.propertyName || 'Untitled accommodation'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.contactEmail}
                            {row.phone ? ` · ${row.phone}` : ''}
                            {` · ${CURRENCY_OPTIONS.find((option) => option.value === row.currency)?.label || row.currency}`}
                            {` · Check-in ${formatTime12h(row.checkInTime)} · Check-out ${formatTime12h(row.checkOutTime)}`}
                          </p>
                          {row.address ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{row.address}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProperty(row)}
                          disabled={disableActions}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Edit ${row.propertyName}`}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" strokeLinecap="round" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteProperty(row)}
                          disabled={disableActions}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-100 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Delete ${row.propertyName}`}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" strokeLinecap="round" />
                            <path d="M8 6V4h8v2" strokeLinecap="round" />
                            <path d="M6 6l1 14h10l1-14" strokeLinejoin="round" />
                            <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'units' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#0f3f73]">Rooms/Units</h2>
                  <button
                    type="button"
                    onClick={openCreateUnit}
                    disabled={disableActions || properties.length === 0}
                    title={
                      properties.length === 0
                        ? 'Add at least one accommodation first (Accommodation tab).'
                        : undefined
                    }
                    className="rounded-lg bg-[#2b5aed] px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2147c7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    + Add room/unit
                  </button>
                </div>

                {properties.length > 0 && (
                  <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 pb-0.5">
                    <button
                      type="button"
                      onClick={() => setUnitsPropertyId(ALL_ACCOMMODATION_TYPES_KEY)}
                      className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${
                        unitsPropertyId === ALL_ACCOMMODATION_TYPES_KEY
                          ? 'border-[#2b5aed] text-[#0f3f73]'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All accommodations
                    </button>
                    {properties.map((propertyRow) => {
                      const isActive = String(unitsPropertyId) === String(propertyRow.id)
                      return (
                        <button
                          key={propertyRow.id}
                          type="button"
                          onClick={() => setUnitsPropertyId(String(propertyRow.id))}
                          className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${
                            isActive
                              ? 'border-[#2b5aed] text-[#0f3f73]'
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {propertyRow.propertyName || `Accommodation #${propertyRow.id}`}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {units.length === 0 && (
                    <p className="px-3 py-6 text-sm text-slate-500">
                      No rooms/units yet. Add your first room or unit
                      {properties.length === 0
                        ? ' after you create an accommodation on the Accommodation tab.'
                        : ' with the + Add room/unit button.'}
                    </p>
                  )}
                  {units.length > 0 && filteredUnits.length === 0 && (
                    <p className="px-3 py-6 text-sm text-slate-500">
                      No rooms/units linked to this accommodation yet.
                    </p>
                  )}
                  {filteredUnits.map((unit) => (
                    <div key={unit.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eff7ff] text-[#2b5aed] ring-1 ring-blue-100">
                          <TabIcon type="house" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0f3f73]">{unit.name}</p>
                          <p className="text-xs text-slate-500">
                            {unit.propertyName ? (
                              <span className="font-medium text-slate-600">{unit.propertyName}</span>
                            ) : (
                              <span className="text-slate-400">No accommodation linked</span>
                            )}
                            {' · '}
                            {(unit.type && String(unit.type).trim()) || 'No type'}
                            {typeof unit.bedrooms === 'number' ? ` · ${unit.bedrooms} bedroom${unit.bedrooms === 1 ? '' : 's'}` : ''}
                            {typeof unit.beds === 'number' ? ` · ${unit.beds} bed${unit.beds === 1 ? '' : 's'}` : ''} · Max{' '}
                            {unit.maxGuests} guests
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          unit.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {unit.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditUnit(unit)}
                          disabled={disableActions}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Edit ${unit.name}`}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" strokeLinecap="round" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteUnit(unit)}
                          disabled={disableActions}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-100 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Delete ${unit.name}`}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" strokeLinecap="round" />
                            <path d="M8 6V4h8v2" strokeLinecap="round" />
                            <path d="M6 6l1 14h10l1-14" strokeLinejoin="round" />
                            <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'rates' && (
              <div className="space-y-5">
                <h2 className="text-xl font-black tracking-tight text-[#0f3f73]">Rates and Availability / Base Rates</h2>

                {properties.length === 0 ? (
                  <p className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-6 text-sm text-slate-500">
                    Add an accommodation on the <span className="font-semibold text-slate-700">Accommodation</span> tab
                    first, then add
                    rooms/units and return here to set base rates.
                  </p>
                ) : (
                  <>
                    <label className="block max-w-xl text-sm font-semibold text-slate-700">
                      Accommodation
                      <select
                        value={ratesPropertyId ?? ''}
                        onChange={(event) => setRatesPropertyId(event.target.value || null)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#0f3f73]"
                      >
                        {properties.map((propertyRow) => (
                          <option key={propertyRow.id} value={String(propertyRow.id)}>
                            {propertyRow.propertyName || `Accommodation #${propertyRow.id}`}
                          </option>
                        ))}
                      </select>
                    </label>

                    {units.filter((u) => String(u.propertyId) === String(ratesPropertyId)).length === 0 ? (
                      <p className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-6 text-sm text-slate-500">
                        No rooms/units for this accommodation yet. Add them on the{' '}
                        <span className="font-semibold text-slate-700">Rooms/Units</span> tab and link them here, then
                        configure rates.
                      </p>
                    ) : (
                      <>
                    <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 pb-0.5">
                      {units
                        .filter((u) => String(u.propertyId) === String(ratesPropertyId))
                        .map((unit) => {
                        const isUnitTab = unit.id === ratesUnitId
                        return (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => setRatesUnitId(unit.id)}
                            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${
                              isUnitTab
                                ? 'border-teal-600 text-[#0f3f73]'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {unit.name}
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#0f3f73]">
                        Date ranges, rates, and restrictions
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            disabled={
                              disableActions || ratesUnitId == null || otherUnitsForCopy.length === 0
                            }
                            title={
                              otherUnitsForCopy.length === 0
                                ? 'Add another room/unit to copy intervals from.'
                                : undefined
                            }
                            onClick={() => setCopyIntervalsOpen((open) => !open)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                              disableActions || ratesUnitId == null || otherUnitsForCopy.length === 0
                                ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Copy intervals
                            <span
                              className={`text-slate-400 transition ${copyIntervalsOpen ? 'rotate-180 text-slate-600' : ''}`}
                            >
                              ▾
                            </span>
                          </button>
                          {copyIntervalsOpen && otherUnitsForCopy.length > 0 && ratesUnitId != null ? (
                            <div className="absolute right-0 z-30 mt-1 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-slate-100">
                              <p className="text-xs leading-relaxed text-slate-600">
                                Copy base-rate intervals from another room/unit (any accommodation) into{' '}
                                <span className="font-semibold text-slate-800">
                                  {units.find((u) => u.id === ratesUnitId)?.name ?? 'this unit'}
                                </span>
                                . Choose a source unit, then pick one or more intervals below.
                              </p>
                              <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                Copy from
                              </label>
                              <select
                                value={copyIntervalsSourceUnitId}
                                onChange={(event) => setCopyIntervalsSourceUnitId(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                              >
                                <option value="">Select room/unit…</option>
                                {otherUnitsForCopy.map((u) => (
                                  <option key={u.id} value={String(u.id)}>
                                    {(u.propertyName && String(u.propertyName).trim()) ||
                                      `Accommodation #${u.propertyId}`}{' '}
                                    — {u.name}
                                  </option>
                                ))}
                              </select>
                              {copyIntervalsSourceUnitId ? (
                                <>
                                  <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Intervals to copy
                                  </label>
                                  {copySourceIntervalsLoading ? (
                                    <p className="mt-1 text-xs font-medium text-slate-500">Loading intervals…</p>
                                  ) : copySourceIntervals.length === 0 ? (
                                    <p className="mt-1 text-xs text-amber-800">
                                      This room/unit has no intervals to copy.
                                    </p>
                                  ) : (
                                    <>
                                      <select
                                        multiple
                                        size={Math.min(8, Math.max(3, copySourceIntervals.length))}
                                        value={copySelectedIntervalIds.map(String)}
                                        onChange={(event) => {
                                          const selected = Array.from(
                                            event.target.selectedOptions,
                                            (opt) => Number(opt.value),
                                          )
                                          setCopySelectedIntervalIds(selected)
                                        }}
                                        disabled={copyingIntervals}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                                      >
                                        {copySourceIntervals.map((interval) => (
                                          <option key={interval.id} value={String(interval.id)}>
                                            {(interval.name && String(interval.name).trim()) || '—'} ·{' '}
                                            {formatDateDdMmYyyy(interval.startDate)} –{' '}
                                            {formatDateDdMmYyyy(interval.endDate)}
                                          </option>
                                        ))}
                                      </select>
                                      <p className="mt-1 text-[11px] leading-snug text-slate-500">
                                        Hold <kbd className="rounded border border-slate-200 bg-slate-50 px-1">Ctrl</kbd>{' '}
                                        (Windows) or{' '}
                                        <kbd className="rounded border border-slate-200 bg-slate-50 px-1">⌘</kbd> (Mac)
                                        and click to select or deselect multiple intervals.
                                      </p>
                                    </>
                                  )}
                                </>
                              ) : null}
                              <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={copyIntervalsReplace}
                                  onChange={(event) => setCopyIntervalsReplace(event.target.checked)}
                                  className="mt-1 h-4 w-4 rounded border-slate-300"
                                />
                                <span>
                                  Replace existing intervals on this unit (otherwise append copies without deleting)
                                </span>
                              </label>
                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                                  onClick={() => setCopyIntervalsOpen(false)}
                                  disabled={copyingIntervals}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    copyingIntervals ||
                                    !copyIntervalsSourceUnitId ||
                                    copySourceIntervalsLoading ||
                                    copySelectedIntervalIds.length === 0
                                  }
                                  onClick={() => void handleCopyIntervalsFromUnit()}
                                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
                                >
                                  {copyingIntervals ? 'Copying…' : 'Copy'}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={openCreateRateInterval}
                          disabled={disableActions || ratesUnitId == null}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="text-lg leading-none">+</span>
                          Add interval
                        </button>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 border-t-[3px] border-t-sky-500 bg-white shadow-sm">
                      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
                        <h3 className="text-sm font-bold text-[#0f3f73]">Intervals</h3>
                      </div>
                      {loadingRateIntervals ? (
                        <p className="px-4 py-8 text-sm font-semibold text-slate-500">Loading intervals…</p>
                      ) : rateIntervals.length === 0 ? (
                        <p className="px-4 py-8 text-sm text-slate-500">
                          No intervals yet. Use <span className="font-semibold text-slate-700">+ Add interval</span> to
                          create your first date range and base rate.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                            <thead>
                              <tr className="bg-slate-50/50 text-xs font-bold uppercase tracking-wide text-slate-500">
                                <th className="w-10 px-3 py-2.5" aria-hidden />
                                <th className="px-3 py-2.5">Name</th>
                                <th className="px-3 py-2.5">Start date</th>
                                <th className="px-3 py-2.5">End date</th>
                                <th className="px-3 py-2.5">
                                  <span className="block">Min LOS</span>
                                  <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-slate-400">
                                    Length of stay (nights)
                                  </span>
                                </th>
                                <th className="px-3 py-2.5">
                                  <span className="block">Max LOS</span>
                                  <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-slate-400">
                                    Length of stay (nights)
                                  </span>
                                </th>
                                <th className="min-w-[180px] px-3 py-2.5">Days of week</th>
                                <th className="min-w-[120px] px-3 py-2.5">Rates</th>
                                <th className="w-24 px-3 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {rateIntervals.map((interval) => (
                                <tr key={interval.id} className="bg-white hover:bg-slate-50/60">
                                  <td className="px-3 py-2.5 align-middle">
                                    <span
                                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-400"
                                      title="Row details"
                                      aria-hidden
                                    >
                                      +
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 font-medium text-slate-800">
                                    {interval.name?.trim() ? interval.name : '—'}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                                    {formatDateDdMmYyyy(interval.startDate)}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                                    {formatDateDdMmYyyy(interval.endDate)}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                                    {formatLosDisplay(interval.minLos)}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                                    {formatLosDisplay(interval.maxLos)}
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-slate-600">{formatIntervalDaysList(interval.daysOfWeek)}</td>
                                  <td className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-slate-800">
                                    {formatIntervalRatesSummary(interval)}
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <div className="inline-flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => openEditRateInterval(interval)}
                                        disabled={disableActions}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-white disabled:opacity-50"
                                        aria-label="Edit interval"
                                      >
                                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M12 20h9" strokeLinecap="round" />
                                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" strokeLinejoin="round" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteRateInterval(interval)}
                                        disabled={disableActions}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                        aria-label="Delete interval"
                                      >
                                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0f3f73]">Unit Schedule</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Turn each day on or off for every room/unit. Disabled days can represent when it is not available
                    for check-in or bookings.
                  </p>
                </div>

                {units.length === 0 ? (
                  <p className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-6 text-sm text-slate-500">
                    No rooms/units yet. Add them on the <span className="font-semibold text-slate-700">Rooms/Units</span>{' '}
                    tab, then set their weekly schedule here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {units.map((unit) => {
                      const draft = scheduleDrafts[unit.id] ?? normalizeWeekSchedule(unit.weekSchedule)
                      return (
                        <div
                          key={unit.id}
                          className="rounded-xl border border-slate-100 bg-[#fbfdff] p-4 shadow-sm sm:p-5"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#0f3f73]">{unit.name}</p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {unit.propertyName ? `${unit.propertyName} · ` : ''}
                                {(unit.type && String(unit.type).trim()) || 'No type'}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-end gap-4">
                              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                                {WEEK_SCHEDULE_DAYS.map((day) => (
                                  <div key={day.key} className="flex flex-col items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                      {day.label}
                                    </span>
                                    <Toggle
                                      checked={Boolean(draft[day.key])}
                                      onChange={() => toggleScheduleDay(unit.id, day.key)}
                                      disabled={disableActions}
                                    />
                                  </div>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleSaveUnitSchedule(unit.id)}
                                disabled={disableActions || savingScheduleUnitId === unit.id}
                                className="shrink-0 rounded-lg bg-[#2b5aed] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2147c7] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {savingScheduleUnitId === unit.id ? 'Saving…' : 'Save schedule'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <form onSubmit={handleSaveNotifications} className="space-y-5">
                <h2 className="text-lg font-bold text-[#0f3f73]">Email Notifications</h2>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {[
                    { key: 'newBooking', title: 'New Booking', description: 'Receive email when a new booking occurs' },
                    { key: 'cancellation', title: 'Cancellation', description: 'Receive email when a cancellation occurs' },
                    { key: 'checkIn', title: 'Check In', description: 'Receive email when a check in occurs' },
                    { key: 'checkOut', title: 'Check Out', description: 'Receive email when a check out occurs' },
                    { key: 'payment', title: 'Payment', description: 'Receive email when a payment occurs' },
                    { key: 'review', title: 'Review', description: 'Receive email when a review occurs' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-start justify-between gap-4 px-3 py-4">
                      <div>
                        <p className="text-sm font-bold text-[#0f3f73]">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                      </div>
                      <Toggle
                        checked={Boolean(notifications[item.key])}
                        onChange={(next) => setNotifications((previous) => ({ ...previous, [item.key]: next }))}
                        disabled={disableActions}
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={disableActions || savingNotifications}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2b5aed] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#2147c7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SaveIcon />
                  {savingNotifications ? 'Saving…' : 'Save Preferences'}
                </button>
              </form>
            )}

            {activeTab === 'access' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#0f3f73]">Team Access</h2>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {team.map((member) => {
                    const sessionEmail = (getMerchantSession()?.email || '').toLowerCase()
                    const isOwnerRow = sessionEmail && member.email?.toLowerCase() === sessionEmail
                    return (
                    <div key={member.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2b5aed] text-xs font-black text-white">
                        {member.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#0f3f73]">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                      <select
                        value={member.role}
                        onChange={(event) => void handleRoleChange(member, event.target.value)}
                        disabled={disableActions || isOwnerRow}
                        title={isOwnerRow ? 'Owner role is fixed for the signed-in account.' : undefined}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#0f3f73] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {['admin', 'manager', 'staff'].map((role) => (
                          <option key={role} value={role}>
                            {formatRole(role)}
                          </option>
                        ))}
                      </select>
                    </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  disabled={disableActions}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  + Invite Team Member
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {propertyModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-8"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPropertyModal({ open: false, mode: 'create', id: null })
            }
          }}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-blue-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.14)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="property-modal-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-100 px-6 pb-4 pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="property-modal-heading" className="text-lg font-bold text-[#0f3f73]">
                    Accommodation
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {propertyModal.mode === 'create'
                      ? 'Fill in the details below, then save to add this accommodation to your list.'
                      : 'Update the fields below and save your changes.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                  onClick={() => setPropertyModal({ open: false, mode: 'create', id: null })}
                >
                  Close
                </button>
              </div>
            </div>

            <form className="space-y-5 px-6 py-5" onSubmit={handleSavePropertyModal}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Accommodation name
                  <input
                    required
                    value={propertyForm.propertyName}
                    onChange={(event) =>
                      setPropertyForm((previous) => ({ ...previous, propertyName: event.target.value }))
                    }
                    placeholder="hofros Properties"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f3f73] focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Contact Email
                  <input
                    required
                    type="email"
                    value={propertyForm.contactEmail}
                    onChange={(event) =>
                      setPropertyForm((previous) => ({ ...previous, contactEmail: event.target.value }))
                    }
                    placeholder="host@hofros.local"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f3f73] focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Phone
                  <input
                    type="tel"
                    value={propertyForm.phone}
                    onChange={(event) => setPropertyForm((previous) => ({ ...previous, phone: event.target.value }))}
                    placeholder="+63 917 000 0000"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f3f73] focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div>
                  <span className="block text-sm font-semibold text-slate-700">Currency</span>
                  <div className="mt-1.5 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">
                    PHP (₱)
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">All accommodations use Philippine Peso (PHP).</p>
                </div>
                <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                  Address
                  <textarea
                    value={propertyForm.address}
                    onChange={(event) => setPropertyForm((previous) => ({ ...previous, address: event.target.value }))}
                    placeholder="Street, barangay, city, province / region"
                    rows={3}
                    className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f3f73] focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Check-in Time
                  <div className="relative mt-1.5">
                    <input
                      type="time"
                      value={propertyForm.checkInTime}
                      onChange={(event) =>
                        setPropertyForm((previous) => ({ ...previous, checkInTime: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 py-2.5 pl-3 pr-11 text-sm text-slate-800 outline-none focus:border-[#0f3f73] focus:ring-2 focus:ring-blue-100"
                    />
                    <ClockIcon className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  </div>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Check-out Time
                  <div className="relative mt-1.5">
                    <input
                      type="time"
                      value={propertyForm.checkOutTime}
                      onChange={(event) =>
                        setPropertyForm((previous) => ({ ...previous, checkOutTime: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 py-2.5 pl-3 pr-11 text-sm text-slate-800 outline-none focus:border-[#0f3f73] focus:ring-2 focus:ring-blue-100"
                    />
                    <ClockIcon className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  </div>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={savingPropertyModal}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2b5aed] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2147c7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SaveIcon />
                  {savingPropertyModal ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setPropertyModal({ open: false, mode: 'create', id: null })}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {unitModal.open && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/40">
          <div className="flex min-h-full items-start justify-center px-4 py-10">
            <div className="w-full max-w-6xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black text-[#0f3f73]">
                {unitModal.mode === 'create' ? 'Add room/unit' : 'Edit room/unit'}
              </h3>
              <button
                type="button"
                disabled={savingUnitModal}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40"
                onClick={closeUnitModal}
              >
                Close
              </button>
            </div>
            <form className="mt-4 space-y-3" onSubmit={handleSaveUnit}>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Accommodation
                  <select
                    required
                    value={unitForm.propertyId}
                    onChange={(event) => setUnitForm((previous) => ({ ...previous, propertyId: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      {properties.length === 0
                        ? 'No accommodations — add one in the Accommodation tab'
                        : 'Select an accommodation'}
                    </option>
                    {properties.map((propertyRow) => (
                      <option key={propertyRow.id} value={String(propertyRow.id)}>
                        {propertyRow.propertyName || `Accommodation #${propertyRow.id}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Name
                  <input
                    required
                    value={unitForm.name}
                    onChange={(event) => setUnitForm((previous) => ({ ...previous, name: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Type
                  <select
                    required
                    value={selectedUnitTypeValue}
                    onChange={(event) => {
                      const next = event.target.value
                      if (next === UNIT_TYPE_OTHER_VALUE) {
                        const current = typeof unitForm.type === 'string' ? unitForm.type.trim() : ''
                        const isKnown = unitTypeOptions.some((option) => option.toLowerCase() === current.toLowerCase())
                        setIsCustomUnitType(true)
                        if (isKnown) {
                          setUnitForm((previous) => ({ ...previous, type: '' }))
                        }
                        setCustomUnitTypeInput((previous) => (previous ? previous : isKnown ? '' : current))
                        return
                      }
                      setIsCustomUnitType(false)
                      setCustomUnitTypeInput('')
                      setUnitForm((previous) => ({ ...previous, type: next }))
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Select unit type
                    </option>
                    {unitTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value={UNIT_TYPE_OTHER_VALUE}>Others</option>
                  </select>
                  {isCustomUnitType ? (
                    <input
                      required
                      value={customUnitTypeInput}
                      onChange={(event) => {
                        const value = event.target.value
                        setCustomUnitTypeInput(value)
                        setUnitForm((previous) => ({ ...previous, type: value }))
                      }}
                      placeholder="Enter custom unit type"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  ) : null}
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Details
                  <input
                    maxLength={500}
                    value={unitForm.details}
                    onChange={(event) => setUnitForm((previous) => ({ ...previous, details: event.target.value }))}
                    placeholder="Short highlights (amenities, floor, view…)"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">
                    {unitForm.details.length}/500
                  </span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Max guests
                  <input
                    required
                    type="number"
                    min="1"
                    value={unitForm.maxGuests}
                    onChange={(event) => setUnitForm((previous) => ({ ...previous, maxGuests: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Bedrooms
                  <input
                    required
                    type="number"
                    min="0"
                    value={unitForm.bedrooms}
                    onChange={(event) => setUnitForm((previous) => ({ ...previous, bedrooms: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Beds
                  <input
                    required
                    type="number"
                    min="0"
                    value={unitForm.beds}
                    onChange={(event) => setUnitForm((previous) => ({ ...previous, beds: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Status
                  <select
                    value={unitForm.status}
                    onChange={(event) => setUnitForm((previous) => ({ ...previous, status: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Description
                <textarea
                  rows={4}
                  value={unitForm.description}
                  onChange={(event) => setUnitForm((previous) => ({ ...previous, description: event.target.value }))}
                  placeholder="Full description for listings and guests"
                  className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <div>
                <span className="block text-sm font-semibold text-slate-700">Photos</span>
                <p className="mt-0.5 text-xs text-slate-500">
                  Up to {MAX_UNIT_IMAGES} images (JPEG, PNG, WebP, GIF; 5 MB each). Saved images upload after you save
                  the room/unit.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="sr-only"
                      disabled={
                        savingUnitModal ||
                        (Array.isArray(unitForm.images) ? unitForm.images.length : 0) +
                          pendingUnitImageFiles.length >=
                          MAX_UNIT_IMAGES
                      }
                      onChange={handleUnitImageFilesSelected}
                    />
                    Add images
                  </label>
                  <span className="text-xs text-slate-500">
                    {(Array.isArray(unitForm.images) ? unitForm.images.length : 0) + pendingUnitImageFiles.length} /{' '}
                    {MAX_UNIT_IMAGES}
                  </span>
                </div>
                {(Array.isArray(unitForm.images) ? unitForm.images.length : 0) +
                  pendingUnitImageFiles.length >
                  0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                    {(unitForm.images || []).map((src, index) => (
                      <div
                        key={`saved-${index}-${src.slice(-24)}`}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <img src={resolvePublicStorageUrl(src)} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          disabled={savingUnitModal}
                          onClick={() =>
                            setUnitForm((previous) => ({
                              ...previous,
                              images: (previous.images || []).filter((_, imageIndex) => imageIndex !== index),
                            }))
                          }
                          className="absolute right-1 top-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {pendingUnitImageFiles.map((file, index) => (
                      <div
                        key={`pending-${index}-${file.name}`}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50"
                      >
                        <img
                          src={pendingImagePreviewUrls[index] || ''}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-amber-600/90 px-1 py-0.5 text-[10px] font-bold uppercase text-white">
                          New
                        </span>
                        <button
                          type="button"
                          disabled={savingUnitModal}
                          onClick={() =>
                            setPendingUnitImageFiles((previous) => previous.filter((_, fileIndex) => fileIndex !== index))
                          }
                          className="absolute right-1 top-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={savingUnitModal}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                  onClick={closeUnitModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUnitModal}
                  className="rounded-lg bg-[#2b5aed] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {savingUnitModal ? 'Saving…' : 'Save room/unit'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {rateIntervalModal.open && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/40">
          <div className="flex min-h-full items-start justify-center px-4 py-8">
            <div className="w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 border-t-[3px] border-t-[#2b5aed] bg-white shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
                <h3 className="text-xl font-black tracking-tight text-[#0f3f73]">
                  {rateIntervalModal.mode === 'create' ? 'Add interval' : 'Edit interval'}
                </h3>
                <button
                  type="button"
                  disabled={savingRateInterval}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40"
                  onClick={closeRateIntervalModal}
                >
                  Close
                </button>
              </div>
              <form className="space-y-5 px-6 py-5" onSubmit={handleSaveRateInterval}>
                <label className="block text-sm font-semibold text-slate-700">
                  Interval name
                  <input
                    value={rateIntervalForm.name}
                    onChange={(event) => setRateIntervalForm((p) => ({ ...p, name: event.target.value }))}
                    placeholder="Interval name"
                    className="mt-1 w-full border-b border-slate-200 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2b5aed]"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    <span className="inline-flex items-center">
                      Start date <span className="text-rose-500">*</span>
                    </span>
                    <span className="relative mt-1 flex items-center">
                      <input
                        required
                        type="date"
                        value={rateIntervalForm.startDate}
                        onChange={(event) => setRateIntervalForm((p) => ({ ...p, startDate: event.target.value }))}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-10 text-sm"
                      />
                      <span className="pointer-events-none absolute right-2 text-slate-400" aria-hidden>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                        </svg>
                      </span>
                    </span>
                    <span className="mt-0.5 text-xs text-slate-500">Shown as {formatDateDdMmYyyy(rateIntervalForm.startDate)}</span>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    <span className="inline-flex items-center">
                      End date <span className="text-rose-500">*</span>
                    </span>
                    <span className="relative mt-1 flex items-center">
                      <input
                        required
                        type="date"
                        value={rateIntervalForm.endDate}
                        onChange={(event) => setRateIntervalForm((p) => ({ ...p, endDate: event.target.value }))}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-10 text-sm"
                      />
                      <span className="pointer-events-none absolute right-2 text-slate-400" aria-hidden>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                        </svg>
                      </span>
                    </span>
                    <span className="mt-0.5 text-xs text-slate-500">Shown as {formatDateDdMmYyyy(rateIntervalForm.endDate)}</span>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    <span className="flex flex-wrap items-center gap-x-1.5">
                      <span>Min LOS</span>
                      <span className="text-xs font-normal text-slate-500">(length of stay · nights)</span>
                      <FieldHint title="LOS means length of stay: the shortest booking allowed, in nights (consecutive days of the stay). Leave empty or 0 for no minimum." />
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0 = none"
                      autoComplete="off"
                      value={rateIntervalForm.minLos}
                      onChange={(event) => setRateIntervalForm((p) => ({ ...p, minLos: event.target.value.replace(/\D/g, '') }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    <span className="flex flex-wrap items-center gap-x-1.5">
                      <span>Max LOS</span>
                      <span className="text-xs font-normal text-slate-500">(length of stay · nights)</span>
                      <FieldHint title="LOS means length of stay: the longest booking allowed, in nights. Leave empty or 0 for no maximum." />
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0 = none"
                      autoComplete="off"
                      value={rateIntervalForm.maxLos}
                      onChange={(event) => setRateIntervalForm((p) => ({ ...p, maxLos: event.target.value.replace(/\D/g, '') }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">
                      Closed to arrival
                      <FieldHint title="When yes, guests cannot check in on the first night of this rate window." />
                    </span>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-700">
                        <input
                          type="radio"
                          name="rate-cta"
                          className="h-4 w-4 border-slate-300 text-[#2b5aed]"
                          checked={!rateIntervalForm.closedToArrival}
                          onChange={() => setRateIntervalForm((p) => ({ ...p, closedToArrival: false }))}
                        />
                        No
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-700">
                        <input
                          type="radio"
                          name="rate-cta"
                          className="h-4 w-4 border-slate-300 text-[#2b5aed]"
                          checked={rateIntervalForm.closedToArrival}
                          onChange={() => setRateIntervalForm((p) => ({ ...p, closedToArrival: true }))}
                        />
                        Yes
                      </label>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-700">
                      Closed to departure
                      <FieldHint title="When yes, guests cannot end their stay on the last night of this window under this rule set." />
                    </span>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-700">
                        <input
                          type="radio"
                          name="rate-ctd"
                          className="h-4 w-4 border-slate-300 text-[#2b5aed]"
                          checked={!rateIntervalForm.closedToDeparture}
                          onChange={() => setRateIntervalForm((p) => ({ ...p, closedToDeparture: false }))}
                        />
                        No
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-700">
                        <input
                          type="radio"
                          name="rate-ctd"
                          className="h-4 w-4 border-slate-300 text-[#2b5aed]"
                          checked={rateIntervalForm.closedToDeparture}
                          onChange={() => setRateIntervalForm((p) => ({ ...p, closedToDeparture: true }))}
                        />
                        Yes
                      </label>
                    </div>
                  </div>
                </div>

                <label className="block text-sm font-semibold text-slate-700">
                  Currency
                  <select
                    value={rateIntervalForm.currency}
                    onChange={(event) => setRateIntervalForm((p) => ({ ...p, currency: event.target.value }))}
                    className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {CURRENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    <span className="inline-flex flex-wrap items-center gap-1">
                      Define which days of week this will be available and indicate the price for that day.
                      <FieldHint title="Toggle each day on or off, then set the nightly base rate for that day. Use Apply to all to fill every day at once." />
                    </span>
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                          <th className="w-24 py-2 text-left font-bold text-slate-700 normal-case"> </th>
                          <th className="min-w-[140px] px-2 py-2">Apply to all</th>
                          {INTERVAL_DAY_ORDER.map((day) => {
                            const on = Boolean(rateIntervalForm.daysOfWeek[day.key])
                            return (
                              <th key={day.key} className="min-w-[72px] px-1 py-2">
                                <div>{day.label}</div>
                                <button
                                  type="button"
                                  className="mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-[#2b5aed] transition hover:bg-slate-50"
                                  title={on ? 'Click to exclude this day' : 'Click to include this day'}
                                  onClick={() =>
                                    setRateIntervalForm((p) => ({
                                      ...p,
                                      daysOfWeek: { ...p.daysOfWeek, [day.key]: !p.daysOfWeek[day.key] },
                                    }))
                                  }
                                >
                                  {on ? (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ) : (
                                    <span className="text-xs text-slate-300">—</span>
                                  )}
                                </button>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-slate-200">
                          <th className="py-3 pr-2 text-left text-sm font-bold text-slate-800">Price</th>
                          <td className="px-2 py-3 align-middle">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <span className="relative inline-flex min-w-0 flex-1 items-center">
                                <span className="pointer-events-none absolute left-2 text-sm text-slate-500">
                                  {rateCurrencySymbol(rateIntervalForm.currency)}
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0"
                                  value={rateIntervalForm.bulkDayPrice}
                                  onChange={(event) => setRateIntervalForm((p) => ({ ...p, bulkDayPrice: event.target.value }))}
                                  onFocus={() =>
                                    setRateIntervalForm((p) =>
                                      p.bulkDayPrice === '0' ? { ...p, bulkDayPrice: '' } : p,
                                    )
                                  }
                                  onBlur={(event) => {
                                    const v = event.target.value.trim()
                                    setRateIntervalForm((p) => ({ ...p, bulkDayPrice: v === '' ? '0' : v }))
                                  }}
                                  className={`min-w-0 pl-7 pr-2 text-sm ${priceInputClass(rateIntervalForm.bulkDayPrice)}`}
                                />
                              </span>
                              <button
                                type="button"
                                className="shrink-0 rounded border-2 border-[#2b5aed] bg-white px-3 py-1.5 text-xs font-bold text-[#2b5aed] transition hover:bg-blue-50"
                                onClick={() =>
                                  setRateIntervalForm((p) => {
                                    const v = p.bulkDayPrice === '' ? '0' : p.bulkDayPrice
                                    const next = { ...p.dayPrices }
                                    for (const { key } of INTERVAL_DAY_ORDER) {
                                      next[key] = v
                                    }
                                    return { ...p, dayPrices: next }
                                  })
                                }
                              >
                                APPLY &gt;
                              </button>
                            </div>
                          </td>
                          {INTERVAL_DAY_ORDER.map((day) => (
                            <td key={day.key} className="px-1 py-3 align-middle">
                              <span className="relative flex w-full items-center">
                                <span className="pointer-events-none absolute left-1.5 text-xs text-slate-500">
                                  {rateCurrencySymbol(rateIntervalForm.currency)}
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0"
                                  value={rateIntervalForm.dayPrices[day.key] ?? '0'}
                                  onChange={(event) =>
                                    setRateIntervalForm((p) => ({
                                      ...p,
                                      dayPrices: { ...p.dayPrices, [day.key]: event.target.value },
                                    }))
                                  }
                                  onFocus={() =>
                                    setRateIntervalForm((p) => {
                                      const cur = p.dayPrices[day.key] ?? '0'
                                      if (cur !== '0') return p
                                      return { ...p, dayPrices: { ...p.dayPrices, [day.key]: '' } }
                                    })
                                  }
                                  onBlur={(event) => {
                                    const v = event.target.value.trim()
                                    setRateIntervalForm((p) => ({
                                      ...p,
                                      dayPrices: { ...p.dayPrices, [day.key]: v === '' ? '0' : v },
                                    }))
                                  }}
                                  className={`w-full pl-6 pr-1 text-center text-xs ${priceInputClass(
                                    rateIntervalForm.dayPrices[day.key] ?? '0',
                                  )}`}
                                />
                              </span>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    disabled={savingRateInterval}
                    className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-40"
                    onClick={closeRateIntervalModal}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={savingRateInterval}
                    className="rounded-lg bg-[#2b5aed] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2147c7] disabled:opacity-60"
                  >
                    {savingRateInterval ? 'Saving…' : rateIntervalModal.mode === 'create' ? 'ADD INTERVAL' : 'SAVE INTERVAL'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black text-[#0f3f73]">Invite team member</h3>
              <button type="button" className="text-sm font-semibold text-slate-500" onClick={() => setInviteOpen(false)}>
                Close
              </button>
            </div>
            <form className="mt-4 space-y-3" onSubmit={handleInvite}>
              <label className="block text-sm font-semibold text-slate-700">
                Email
                <input
                  required
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) => setInviteForm((previous) => ({ ...previous, email: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Name (optional)
                <input
                  value={inviteForm.name}
                  onChange={(event) => setInviteForm((previous) => ({ ...previous, name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Role
                <select
                  value={inviteForm.role}
                  onChange={(event) => setInviteForm((previous) => ({ ...previous, role: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-[#2b5aed] px-4 py-2 text-sm font-bold text-white">
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfigurationPage
