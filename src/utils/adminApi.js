import { apiFetch } from './api'
import { clearAdminSession, getAdminApiToken } from './auth'

export async function adminFetch(path, options = {}) {
  try {
    return await apiFetch(path, {
      ...options,
      authToken: getAdminApiToken(),
    })
  } catch (error) {
    if (error?.status === 401 && typeof window !== 'undefined') {
      clearAdminSession()
      window.location.assign('/admin/login')
    }
    throw error
  }
}
