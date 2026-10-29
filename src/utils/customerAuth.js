const CUSTOMER_SESSION_KEY = 'hofros:customer-session'

function readSession() {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const stored = window.localStorage.getItem(CUSTOMER_SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function getCustomerSession() {
  const session = readSession()
  if (!session?.token || !session?.customer) {
    return null
  }
  return session
}

export function getCustomerToken() {
  return getCustomerSession()?.token ?? ''
}

export function setCustomerSession({ token, customer }) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(
    CUSTOMER_SESSION_KEY,
    JSON.stringify({
      token,
      customer,
    }),
  )
}

export function clearCustomerSession() {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY)
}
