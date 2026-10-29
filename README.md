# Hofros frontend (`hofros-core`)

React + Vite UI for Hofros. Deployment foundation mirrors LPay (`lpay-core`).

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000. API calls use the relative base `/api/v1`, which the
Vite dev server proxies to Laravel (`VITE_APP_URL`, default http://127.0.0.1:8000).

- API (via proxy): http://localhost:3000/api
- Health (via proxy): http://localhost:3000/api/health

## Deploy (Vercel → Hostinger API)

1. Import this repo in Vercel (build `npm run build`, output `dist` — see `vercel.json`).
2. Set the env vars from `.env.vercel.example` in Vercel → Settings → Environment Variables:
   - `VITE_API_BASE_URL=https://your-hofros-site.hostingersite.com/api/v1`
   - `VITE_FRONTEND_URL=https://hofros.vercel.app`
3. Redeploy (Vite bakes env vars in at build time).
4. On Hostinger `backend/.env`, add the Vercel URL to `FRONTEND_URL` and
   `CORS_ALLOWED_ORIGINS`, then `php artisan config:clear`.

Backend setup is documented in `hofros-ws/hostinger/README.md`.
