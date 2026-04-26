# Deploying EngageSphere

Frontend on **Vercel** via **GitHub Actions**, env vars managed by **Doppler**.
Backend hosting decided separately (see end of file).

```
GitHub push  ──▶  GitHub Actions  ──▶  vercel build  ──▶  Vercel CDN
                                          ▲
                                          │ (env vars synced)
                                       Doppler
```

---

## 1 · Doppler — set up the project

1. **Create a project** in Doppler (e.g. `engagesphere`) with two configs:
   `dev` and `prd`.
2. Add the frontend env vars to **prd**:
   - `VITE_API_URL` — `https://api.yourdomain.com` (your backend origin)
   - `VITE_SOCKET_URL` — same as above
   - `VITE_AGORA_APP_ID` — fallback Agora App ID (optional)
   - `VITE_GIPHY_API_KEY` — optional
3. (Recommended) Install Doppler CLI locally and `doppler login` so you can
   `doppler run -- npm run dev` in `frontend/` for local dev.

---

## 2 · Vercel — connect the project

1. **vercel.com → Add New → Project → Import** your GitHub repo.
2. Vercel will detect the `frontend/vercel.json`. Confirm:
   - **Root Directory:** `frontend`
   - **Framework:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Disable** "Auto Deploy" on every push — we'll drive it from GitHub
   Actions instead. (Settings → Git → toggle off.)
4. (If you want Vercel to keep auto-deploying on push, leave it on and skip
   step 4 below; the GitHub Actions workflow becomes optional.)

### Wire Doppler → Vercel

Use the official Doppler integration:

1. Doppler dashboard → your project → **Integrations → Vercel** → connect.
2. Pick the Vercel project + the `prd` config.
3. Doppler now syncs every secret to Vercel's **Environment Variables → Production**
   automatically — no manual copying.

---

## 3 · GitHub Actions — the workflow

The workflow lives at `.github/workflows/deploy-frontend.yml` and runs on:
- any push to `main` that touches `frontend/**`
- manual `workflow_dispatch`

### Required GitHub repo secrets

Set these in **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Where to find it |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Run `vercel link` once locally — `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same file |

The fastest way to get the last two:

```bash
cd frontend
npx vercel link            # follow prompts, picks the existing project
cat .vercel/project.json   # copy "orgId" and "projectId"
```

> Don't commit `.vercel/`. It's safe to leave there locally; it's gitignored
> by default.

### What the workflow does

1. Checks out the repo.
2. Installs Node 20 + Vercel CLI.
3. `vercel pull` — downloads project config + Doppler-synced env vars.
4. `vercel build --prod` — runs the Vite build with prod env.
5. `vercel deploy --prebuilt --prod` — uploads the prebuilt artifact (no
   rebuilding on Vercel's side, deploy is ~10s instead of ~2min).

That's it — push to main, watch the Actions tab, the new build goes live.

---

## 4 · Custom domain on Vercel

1. Vercel project → **Settings → Domains → Add** `yourdomain.com` (or
   subdomain).
2. Vercel shows the DNS records you need:
   - **Apex** (`yourdomain.com`): `A 76.76.21.21`
   - **Subdomain** (`app.yourdomain.com`): `CNAME cname.vercel-dns.com`
3. Add those records at your domain registrar's DNS panel.
4. Wait 5–30 minutes for DNS to propagate. TLS is auto-issued by Vercel.

---

## 5 · Backend (still TODO)

The frontend will call `VITE_API_URL` for REST and `VITE_SOCKET_URL` for
Socket.IO. The backend needs to live somewhere — pick one:

- **Railway** — easiest, supports Node + websockets, ~$5/month after trial.
- **Render** — free tier sleeps; paid is fine.
- **Fly.io** — Docker-based, generous free tier, the existing `Dockerfile` works.
- **VPS** (DigitalOcean / Hetzner) — `docker compose up` + Caddy in front.

When the backend is up, **two things must change** because frontend and backend
are now on different origins:

### a) Cookies must be cross-origin

In `backend/utils/generateToken.js` and `backend/controllers/auth.controller.js`
the cookie currently uses:

```js
sameSite: "strict",
secure: process.env.NODE_ENV !== "development",
```

For cross-origin auth (Vercel domain ↔ backend domain) change to:

```js
sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
secure: process.env.NODE_ENV === "production",
```

`sameSite: "none"` requires `secure: true`, so make sure both origins are
HTTPS in prod (they will be — Vercel issues TLS, your backend host should
too).

### b) CORS must allow the Vercel origin

Set `FRONTEND_URL=https://app.yourdomain.com` in the backend's env (Doppler
config for backend, separate from frontend). The existing CORS code in
`backend/server.js` already reads `process.env.FRONTEND_URL` and adds it to
the allowed origins list, so no code change needed.

---

## 6 · Post-deploy checklist

- [ ] Vercel build succeeds (Actions tab green)
- [ ] `https://app.yourdomain.com` loads the React app
- [ ] DevTools → Network: API calls go to `VITE_API_URL`, not `localhost:5000`
- [ ] DevTools → Application → Cookies: `jwt` cookie is set after login
- [ ] DevTools → Network → WS: Socket.IO upgrades to `wss://`
- [ ] Sending a message in two devices syncs in real time

---

## Common gotchas

- **`vercel pull` says "no project linked"** in CI. → wrong `VERCEL_ORG_ID`
  / `VERCEL_PROJECT_ID` secret.
- **API calls hit `localhost:5000` in production.** → `VITE_API_URL` wasn't
  set in Doppler-prd, OR the GitHub Actions ran before Doppler was wired
  up. Re-run the workflow after fixing Doppler.
- **Login works once but next page reload says you're logged out.** →
  cookie `sameSite` is still `"strict"` after splitting frontend/backend.
  See section 5a.
- **`Failed to fetch` on first request after deploy.** → backend's CORS
  doesn't include the Vercel domain. Set `FRONTEND_URL` in the backend's
  Doppler config and redeploy backend.
