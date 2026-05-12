# Build, install, and deployment

This file complements the root **`README.md`**. Use **README** for day‑one local setup, env variable names, and testing commands. Use **this file** for production builds and how to deploy.

---

## 1. Prerequisites

Same as README: **Node.js (LTS)**, **MySQL**, optional **Redis** (matching cache), **Google OAuth** Web client for sign-in.

---

## 2. Installation (summary)

| Step | Command / action |
|------|------------------|
| Server deps | `cd server && npm install` |
| Server env | `cp .env.example .env` then edit (DB, `GOOGLE_CLIENT_ID`, `AUTH_JWT_SECRET`, `PORT`, etc.) |
| Client deps | `cd client && npm install` |
| Client env | `cp .env.example .env.development.local` — set `REACT_APP_API_BASE_URL` and `REACT_APP_GOOGLE_CLIENT_ID` (must match server) |

Full narrative: **`README.md`** → sections *Quick setup*, *Prerequisites*, *Environment variables*.

---

## 3. Production build

### API (Node / Express)

No separate compile step; production is “run Node with production env.”

```bash
cd server
npm install --omit=dev   # optional: smaller install on a server
NODE_ENV=production node ./bin/www
```

Set **`NODE_ENV=production`**, real **`DB_*`**, **`AUTH_JWT_SECRET`**, **`GOOGLE_CLIENT_ID`**, and turn off unsafe dev defaults (e.g. do not rely on `DB_SYNC` / `DB_SYNC_ALTER` in production—use migrations or a controlled schema process).

### Client (React / CRA)

```bash
cd client
# Set production API URL before build (CRA inlines at build time)
export REACT_APP_API_BASE_URL=https://your-api.example.com
npm run build
```

Output: **`client/build/`** (static files: HTML, JS, CSS).

---

## 4. Deployment (typical patterns)

Exact steps depend on your host. These are the usual shapes:

### Option A — Split hosting (common)

1. **API:** Run the Express app on a VM, container, or PaaS (Render, Fly.io, Railway, AWS ECS, etc.). Listen on the port your platform assigns; set **`PORT`** or reverse-proxy to HTTPS.
2. **Client:** Upload **`client/build/`** to static hosting (Netlify, Vercel, S3 + CloudFront, GitHub Pages with correct `homepage` / router base if needed).
3. **CORS:** Ensure **`server`** allows your SPA origin (see `server/app.js` allowed origins list; extend for production domain).
4. **Secrets:** Store `AUTH_JWT_SECRET`, DB password, and Google client secret (if used) in the host’s secret manager, not in git.

### Option B — Same machine

Run **`node ./bin/www`** behind **nginx** (or Caddy): nginx serves **`client/build`** as static files and **proxies** `/api` or path prefixes to `localhost:3001` (or whatever port Express uses).

### Health check

After deploy, verify:

- `GET https://your-api/health` or your root route returns **200** (if you expose one).
- SPA loads and **`REACT_APP_API_BASE_URL`** points at the live API (browser devtools → Network).

---

## 5. Quality gates before release

```bash
cd server && npm run lint && npm test
cd client && npm run lint && npm run build
```

Optional: `npm run test:coverage` in each package; Playwright e2e is documented in README.

---

## 6. Troubleshooting (deploy-related)

| Symptom | Check |
|---------|--------|
| Google sign-in fails in prod | Authorized **JavaScript origins** include production SPA URL; `REACT_APP_GOOGLE_CLIENT_ID` matches Google Console Web client. |
| API 401 / CORS errors | Production origin in server CORS allowlist; cookies / credentials if you use them. |
| Wrong API host in UI | Rebuild client after changing **`REACT_APP_API_BASE_URL`** (not read at runtime from a random `.env` on the server). |

---

For local development, tests, and Playwright details, see **`README.md`**.
