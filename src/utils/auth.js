const MERCHANT_SESSION_KEY = 'hofros:merchant-session'
const MERCHANT_ACCOUNTS_KEY = 'hofros:merchant-accounts'

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

export function getMerchantSession() {
  return readMerchantSession()
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
