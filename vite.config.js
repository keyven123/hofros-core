import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  // Local only: must match Laravel APP_URL (php artisan serve).
  const apiOrigin =
    env.VITE_APP_URL || env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'

  const proxy = {
    // Browser: http://localhost:3000/api/* → Laravel APP_URL /api/*
    '/api': {
      target: apiOrigin,
      changeOrigin: true,
    },
    '/storage': {
      target: apiOrigin,
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    envDir: __dirname,
    server: {
      port: 3000,
      strictPort: true,
      proxy,
    },
    preview: {
      port: 3000,
      strictPort: true,
      proxy,
    },
  }
})
