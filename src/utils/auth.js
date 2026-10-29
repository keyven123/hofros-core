const MERCHANT_SESSION_KEY = 'hofros:merchant-session'
const MERCHANT_ACCOUNTS_KEY = 'hofros:merchant-accounts'
const ADMIN_SESSION_KEY = 'hofros:admin-session'
const MARKETING_SESSION_KEY = 'hofros:marketing-session'

function readMerchantSession() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(MERCHANT_SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}

function readMerchantAccounts() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = window.localStorage.getItem(MERCHANT_ACCOUNTS_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

export function isMerchantAuthenticated() {
  const session = readMerchantSession()
  if (!session?.isAuthenticated) {
    return false
  }
  const token = session?.apiToken
  return typeof token === 'string' && token.trim().length > 0
}

export function setMerchantAuthenticated(payload = {}) {
  if (typeof window === 'undefined') {
    return
  }

  const session = {
    isAuthenticated: true,
    email: payload.email ?? '',
    merchantName: payload.merchantName ?? '',
    apiToken: payload.apiToken ?? '',
    createdAt: new Date().toISOString(),
  }

  window.localStorage.setItem(MERCHANT_SESSION_KEY, JSON.stringify(session))
}

export function clearMerchantSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(MERCHANT_SESSION_KEY)
}

function readAdminSession() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(ADMIN_SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}

export function isAdminAuthenticated() {
  const session = readAdminSession()
  if (!session?.isAuthenticated) {
    return false
  }
  const token = session?.apiToken
  return typeof token === 'string' && token.trim().length > 0
}

export function setAdminAuthenticated(payload = {}) {
  if (typeof window === 'undefined') {
    return
  }

  const session = {
    isAuthenticated: true,
    email: payload.email ?? '',
    apiToken: payload.apiToken ?? '',
    createdAt: new Date().toISOString(),
  }

  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
}

export function clearAdminSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function getAdminSession() {
  return readAdminSession()
}

function readMarketingSession() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(MARKETING_SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}

export function isMarketingAuthenticated() {
  const session = readMarketingSession()
  if (!session?.isAuthenticated) {
    return false
  }
  const token = session?.apiToken
  return typeof token === 'string' && token.trim().length > 0
}

export function setMarketingAuthenticated(payload = {}) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    MARKETING_SESSION_KEY,
    JSON.stringify({
      isAuthenticated: true,
      name: payload.name ?? '',
      email: payload.email ?? '',
      apiToken: payload.apiToken ?? '',
      createdAt: new Date().toISOString(),
    }),
  )
}

export function clearMarketingSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(MARKETING_SESSION_KEY)
}

export function getMarketingSession() {
  return readMarketingSession()
}

export function getMarketingApiToken() {
  const session = readMarketingSession()
  const token = session?.apiToken
  return typeof token === 'string' && token.trim() ? token.trim() : ''
}

export function getAdminApiToken() {
  const session = readAdminSession()
  const token = session?.apiToken
  return typeof token === 'string' && token.trim() ? token.trim() : ''
}

export function getMerchantSession() {
  return readMerchantSession()
}

export function updateMerchantSession(partial) {
  if (typeof window === 'undefined') {
    return
  }

  const current = readMerchantSession()
  if (!current) {
    return
  }

  window.localStorage.setItem(
    MERCHANT_SESSION_KEY,
    JSON.stringify({
      ...current,
      ...partial,
    }),
  )
  window.dispatchEvent(new Event('hofros-session'))
}

export function getApiToken() {
  const session = readMerchantSession()
  const token = session?.apiToken
  return typeof token === 'string' && token.trim() ? token.trim() : ''
}

export function registerMerchantAccount(payload) {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Registration is unavailable right now.' }
  }

  const email = (payload?.email ?? '').trim().toLowerCase()
  const password = payload?.password ?? ''
  const merchantName = (payload?.merchantName ?? '').trim()

  if (!email || !password || !merchantName) {
    return { success: false, message: 'Missing required account information.' }
  }

  const existingAccounts = readMerchantAccounts()
  const emailExists = existingAccounts.some((account) => account.email === email)
  if (emailExists) {
    return { success: false, message: 'This email is already registered. Please login instead.' }
  }

  const nextAccounts = [
    ...existingAccounts,
    {
      email,
      password,
      merchantName,
      createdAt: new Date().toISOString(),
    },
  ]

  window.localStorage.setItem(MERCHANT_ACCOUNTS_KEY, JSON.stringify(nextAccounts))

  return {
    success: true,
    account: {
      email,
      merchantName,
    },
  }
}

export function authenticateMerchant(email, password) {
  const normalizedEmail = (email ?? '').trim().toLowerCase()
  const normalizedPassword = (password ?? '').trim()

  if (!normalizedEmail || !normalizedPassword) {
    return null
  }

  const accounts = readMerchantAccounts()
  const matched = accounts.find(
    (account) => account.email === normalizedEmail && account.password === normalizedPassword,
  )

  if (!matched) {
    return null
  }

  return {
    email: matched.email,
    merchantName: matched.merchantName,
  }
}
