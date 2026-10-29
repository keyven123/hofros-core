import { getApiToken } from './auth'

function getApiBase() {
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
}

/** App origin for /storage (not the /api prefix). Empty means same-origin (Vite proxy). */
function getPublicOrigin() {
  const base = getApiBase()
  if (!base || base.startsWith('/')) return ''
  if (base.endsWith('/api/v1')) {
    return base.slice(0, -'/api/v1'.length)
  }
  if (base.endsWith('/api')) {
    return base.slice(0, -'/api'.length)
  }
  return base
}

function buildUrl(path) {
  let normalized = path.startsWith('/') ? path : `/${path}`
  const base = getApiBase()
  if (base) {
    // Avoid double-prefix when base already includes version segment (e.g. base: /api/v1 + path: /v1/...)
    if (base.endsWith('/api/v1') && normalized.startsWith('/v1/')) {
      normalized = normalized.slice(3) // drop leading "/v1"
    }
    return `${base}${normalized}`
  }
  return `/api${normalized}`
}

/**
 * Public disk URLs from Laravel may use a wrong APP_URL (e.g. http://localhost without :8000).
 * Relative /storage/... breaks when the SPA runs on another origin unless proxied.
 * This normalizes so <img src> loads from the real API host or same-origin /storage (Vite proxy).
 */
export function resolvePublicStorageUrl(src) {
  if (src == null) return ''
  const trimmed = String(src).trim()
  if (!trimmed) return ''

  const withPublic = (pathname) => {
    const path = pathname.startsWith('/') ? pathname : `/${pathname}`
    const origin = getPublicOrigin()
    if (origin) {
      return `${origin}${path}`
    }
    return path
  }

  if (trimmed.startsWith('/storage/')) {
    return withPublic(trimmed)
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const { pathname } = new URL(trimmed)
      if (pathname.startsWith('/storage/')) {
        return withPublic(pathname)
      }
    } catch {
      // ignore invalid URL
    }
    return trimmed
  }

  return trimmed
}

function firstValidationMessage(body) {
  if (!body || typeof body.errors !== 'object' || body.errors === null) {
    return null
  }
  const values = Object.values(body.errors).flat()
  const first = values.find((item) => typeof item === 'string' && item.trim())
  return first?.trim() || null
}

export async function apiFetch(path, options = {}) {
  const { authToken, ...fetchOptions } = options
  const token = authToken !== undefined ? authToken : getApiToken()
  const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null
  const isFormData =
    typeof FormData !== 'undefined' && hasBody && fetchOptions.body instanceof FormData
  const headers = {
    Accept: 'application/json',
    ...(hasBody && !isFormData && fetchOptions.headers?.['Content-Type'] === undefined
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...fetchOptions.headers,
  }

  if (isFormData) {
    delete headers['Content-Type']
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(buildUrl(path), {
      ...fetchOptions,
      headers,
    })
  } catch (cause) {
    const message =
      cause instanceof TypeError
        ? 'Cannot reach the server. Start the API (e.g. php artisan serve), set APP_URL in ws/.env (used for production builds), and ensure the Vite dev proxy can reach the API—then restart Vite.'
        : 'Network error. Check your connection and try again.'
    const error = new Error(message)
    error.status = 0
    error.cause = cause
    throw error
  }

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text.slice(0, 500) }
    }
  }

  if (!response.ok) {
    const fromValidation = firstValidationMessage(data)
    const fromException = typeof data?.exception === 'string' ? data.exception : null
    const message =
      fromValidation ||
      data?.message ||
      (fromException ? `${fromException}${data?.file ? ` (${data.file}:${data.line ?? '?'})` : ''}` : null) ||
      `Request failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    error.body = data
    throw error
  }

  return data
}

/**
 * Laravel `JsonResource` / `->response()` wraps the payload as `{ data: { ... } }`.
 * Use for single-resource responses so the SPA reads `slug`, `units`, etc. at the top level.
 * @param {unknown} body
 * @returns {unknown}
 */
export function unwrapJsonResourceData(body) {
  if (body != null && typeof body === 'object' && 'data' in body) {
    return body.data
  }
  return body
}

/** Reuse one in-flight GET when StrictMode or sibling effects fire the same URL concurrently. */
const inflightDedupedGets = new Map()

/**
 * Same as {@link apiFetch}, but duplicate GETs to the same `path` share one network request until it settles.
 * POST/PUT/PATCH/DELETE always pass through (no dedupe).
 * @param {string} path
 * @param {Parameters<apiFetch>[1]} [options]
 */
export async function apiFetchDeduped(path, options = {}) {
  const method = String(options?.method ?? 'GET').toUpperCase()
  if (method !== 'GET') {
    return apiFetch(path, options)
  }
  const key = path.startsWith('/') ? path : `/${path}`
  const existing = inflightDedupedGets.get(key)
  if (existing) {
    return existing
  }
  const pending = apiFetch(path, options).finally(() => {
    inflightDedupedGets.delete(key)
  })
  inflightDedupedGets.set(key, pending)
  return pending
}

/**
 * Download a file (e.g. CSV) from an authenticated GET endpoint.
 * @param {string} path - API path including query string (e.g. /v1/analytics/export?year=2026&granularity=daily)
 * @param {string} [fallbackFilename] - Used if Content-Disposition is missing
 */
export async function apiDownloadFile(path, fallbackFilename = 'download.csv') {
  const token = getApiToken()
  const normalized = path.startsWith('/') ? path : `/${path}`
  const url = buildUrl(normalized)
  const headers = {
    Accept: 'text/csv,*/*',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let response
  try {
    response = await fetch(url, { method: 'GET', headers })
  } catch (cause) {
    const message =
      cause instanceof TypeError
        ? 'Cannot reach the server. Check the API and APP_URL in ws/.env (or Vite dev proxy).'
        : 'Network error. Check your connection and try again.'
    const error = new Error(message)
    error.status = 0
    error.cause = cause
    throw error
  }

  if (!response.ok) {
    const text = await response.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { message: text.slice(0, 500) }
      }
    }
    const message = data?.message || `Download failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    error.body = data
    throw error
  }

  const blob = await response.blob()
  let filename = fallbackFilename
  const cd = response.headers.get('Content-Disposition')
  if (cd) {
    const star = /filename\*=UTF-8''([^;]+)/i.exec(cd)
    const quoted = /filename="([^"]+)"/i.exec(cd)
    const plain = /filename=([^;\s]+)/i.exec(cd)
    const raw = star?.[1] ?? quoted?.[1] ?? plain?.[1]
    if (raw) {
      filename = decodeURIComponent(raw.replace(/["']/g, '').trim())
    }
  }

  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}
