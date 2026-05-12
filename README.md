# RoomMatch

Web app that helps students find compatible roommates from lifestyle profiles and preferences, form private groups, coordinate invitations, and align group housing preferences with automated unit assignment.

**Production build & deployment:** see **[BUILD.md](./BUILD.md)** (this README focuses on local setup, env vars, testing, and client production build commands).

**Where to run commands:** open a terminal in this **`roommatch/`** directory (the folder that contains `client/` and `server/`). If you cloned the parent repo, run **`cd roommatch`** first.

## Quick setup

1. **Server config file**  
   - In a terminal: `cd server` then run **`cp .env.example .env`**. That creates a new file named **`.env`** next to `.env.example`.  
   - Open **`.env`** in your editor and change these if they apply to you:  
     - **`GOOGLE_CLIENT_ID`** — always set this to your Google “OAuth 2.0 Client ID” (same idea as on the client). Sign-in will not work until this matches your Google project.  
     - **`AUTH_JWT_SECRET`** — any long random string is fine for running on your own laptop. Use a stronger secret if other people or the public internet can reach your API.  
     - **`DB_PASSWORD`** — only if MySQL is set up with a password for the user in **`DB_USER`** (often `root` has no password on a fresh local install, so you can leave it empty).

2. **Client config file**  
   - `cd client` then **`cp .env.example .env.development.local`**.  
   - **`REACT_APP_API_BASE_URL`** must be the same host and port where the server listens (for example `http://localhost:3001` if **`PORT=3001`** in `server/.env`).  
   - **`REACT_APP_GOOGLE_CLIENT_ID`** must be the **same** value as **`GOOGLE_CLIENT_ID`** in `server/.env`.

3. After that, use the **Install and run locally** commands below; no other secret files are required for a basic run.

## Repository layout

| Path | Role |
|------|------|
| **`client/`** | React (CRA) SPA: Google sign-in UI, profiles, preferences, matches, groups, invitations, chat. |
| **`server/`** | Express API: auth, profiles, matching, groups, invitations, chats; MySQL (Sequelize), optional Redis. |
| **`reference-repo/`** | Older **Next.js / Prisma / Supabase** scaffold and UI ideas. **Not imported** by `client/` or `server/`; safe to ignore for running this app. |

## Tech stack

- **Client:** React 19, React Router 7, Tailwind CSS, `@react-oauth/google`, Playwright (e2e).
- **Server:** Node.js, Express, Sequelize, MySQL2, Redis client, JWT + Google auth, Pino logging, Jest + Supertest.

## Prerequisites

- **Node.js** (LTS recommended).
- **MySQL** — credentials and DB name go in `server/.env` (see `.env.example`).
- **Redis** — optional for local dev; default `REDIS_URL` is `redis://127.0.0.1:6379` in config.
- **Google OAuth** — create a **Web** client in Google Cloud Console; use the same client ID on server and client env files. Authorized JavaScript origins must include your SPA origin (e.g. `http://localhost:3000`). This codebase does **not** filter sign-in by email domain in `auth` routes; restrict who can create a Google client or add a check in `/auth/callback` if your institution requires it.

## Environment variables

Variables are defined in **`server/config/index.js`** (defaults + names). **`server/.env.example`** and **`client/.env.example`** list every name this repo reads.

### Local port convention

- CRA **`npm start`** → UI on **3000** by default.
- Run API with **`PORT=3001`** in `server/.env` (matches **`REACT_APP_API_BASE_URL`** in `client/.env.example`).
- Playwright uses **`E2E_PORT=3100`** by default so e2e does not steal port 3000.

Jest sets a safe **`AUTH_JWT_SECRET`** in tests via `server/__tests__/setup-env.js` when unset.

## Install and run locally

### 1. API server

```bash
cd server
npm install
cp .env.example .env   # then edit .env
npm start
```

### 2. React client

```bash
cd client
npm install
cp .env.example .env.development.local   # then edit if needed
npm start
```

## Testing

### Server (Jest + Supertest)

```bash
cd server
npm test
npm run test:coverage   # thresholds + coverage/lcov-report/index.html
npm run lint
```

### Client — unit / component tests (Jest + React Testing Library)

```bash
cd client
npm test -- --watchAll=false
npm run test:coverage     # coverage/lcov-report/index.html
```

`src/setupTests.js` includes small polyfills needed for React Router v7 under Jest. `package.json` includes **`jest.moduleNameMapper`** entries so `react-router-dom` / `react-router` resolve under CRA’s Jest.

### Client — end-to-end (Playwright)

```bash
cd client
npm run test:e2e:install   # download Chromium into client/node_modules/.cache/ms-playwright
npm run test:e2e
```

- **Dev server for e2e** defaults to **`http://localhost:3100`** (see `client/playwright.config.js`, `E2E_PORT`) so it does not collide with `npm start` on 3000.
- **API** is stubbed in **`client/e2e/helpers.js`** (`http://localhost:3001`) so e2e does not require a live backend.
- **System Chrome (optional):** `PW_USE_SYSTEM_CHROME=1 npm run test:e2e` if you prefer not to use the downloaded browser.
- **Use global Playwright cache (optional):** `PW_USE_GLOBAL_PLAYWRIGHT=1` — otherwise the project pins `PLAYWRIGHT_BROWSERS_PATH` under `client/node_modules/.cache/ms-playwright`.

E2e does **not** merge into CRA’s Jest coverage report unless you add separate instrumentation.

## Builds

```bash
cd client && npm run build
```

Set **`REACT_APP_API_BASE_URL`** to your **production** API origin before building; CRA inlines it at build time. Hosting steps depend on your platform (static SPA + separate Node API, or a single host).

## Lint / format

```bash
cd server && npm run lint && npm run format
cd client && npm run lint && npm run format
```

## Project features (product)

1. **Google-based authentication** — Google ID token verification on the server; email/password routes also exist.
2. **Profiles and preferences** — Lifestyle fields on the profile; roommate preference weights on a separate preferences screen.
3. **Matching** — Compatibility scoring and ranked match lists.
4. **Groups** — Create groups, invitations, readiness, housing preferences, and housing assignment flows.
5. **Chat and invitations** — In-app surfaces wired to the API for conversations and invite inbox.