import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wsDir = path.resolve(__dirname, '../ws')

const DEFAULT_LARAVEL = 'http://127.0.0.1:8000'

function toOrigin(s) {
  const t = (s || DEFAULT_LARAVEL).trim()
  try {
    return new URL(t).origin
  } catch {
    return new URL(DEFAULT_LARAVEL).origin
  }
}

/**
 * Vite cannot proxy to port 5173. When APP_URL is the Vite dev URL, we forward /api to Laravel
 * (LARAVEL_DEV_URL or http://127.0.0.1:8000). Otherwise the proxy target is APP_URL’s origin
 * (e.g. you set APP_URL to your php artisan serve URL).
 */
function devProxyTarget(mode, root) {
  const env = loadEnv(mode, root, '')
  const laravelWhenVite = env.LARAVEL_DEV_URL || env.VITE_LARAVEL_DEV_URL || DEFAULT_LARAVEL
  const raw = (env.APP_URL || '').trim()
  if (!raw) return toOrigin(laravelWhenVite)
  try {
    const u = new URL(raw)
    if (u.port === '5173') {
      return toOrigin(laravelWhenVite)
    }
    return u.origin
  } catch {
    return toOrigin(laravelWhenVite)
  }
}

// Load VITE_* from ws/.env. In production only APP_URL in ws/.env changes; the built app uses /api on that host.
// Split frontend API host: set VITE_API_BASE_URL in ws/.env.
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const proxyTarget = devProxyTarget(mode, wsDir)
  return {
    plugins: [react()],
    envDir: wsDir,
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/storage': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
