import { apiFetch } from './api'
import { clearMarketingSession, getMarketingApiToken } from './auth'

export async function marketingFetch(path, options = {}) {
  try {
    return await apiFetch(path, {
      ...options,
      authToken: getMarketingApiToken(),
    })
  } catch (error) {
    if (error?.status === 401 && typeof window !== 'undefined') {
      clearMarketingSession()
      window.location.assign('/marketing/login')
    }
    throw error
  }
}
