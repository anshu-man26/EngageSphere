# Deploying EngageSphere

Same shape as ClickAndCare:

| Target | Where | Workflow |
|---|---|---|
| `frontend/` | Vercel | `.github/workflows/deploy-frontend.yml` (auto on push to main) |
| `backend/` REST API | AWS Lambda + API Gateway | `.github/workflows/release-backend.yml` (manual) |
| `backend/` Socket.IO | Shared EC2 with ClickAndCare | not in CI — pulled by hand |

## Why the split

Lambda can't hold persistent WebSocket connections. The Express app runs
on Lambda for cheap, scalable REST. Socket.IO needs an always-on host —
EngageSphere reuses the existing ClickAndCare EC2 (different port, different
subdomain, same box).

## Env vars: Doppler is the source of truth

Two configs in Doppler:

| Doppler project / config | Used by |
|---|---|
| `engagesphere-fe / prd` | Vercel (synced via Doppler→Vercel integration) |
| `engagesphere-be / prd` | Lambda + EC2 (read by `doppler run` at deploy/start time) |

Required vars in `engagesphere-be / prd`:

- `NODE_ENV` = `production`
- `MONGO_DB_URI`
- `JWT_SECRET`
- `EMAIL_USER`, `EMAIL_PASS`
- `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET_KEY`
- `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`
- `FRONTEND_URL` = `https://www.engage-sphere.in`
- `OPENAI_API_KEY`, `API_KEY`, `ADMIN_EMAILS` (optional)

Required vars in `engagesphere-fe / prd`:

- `VITE_API_URL` = your Lambda HTTP API base (e.g.
  `https://abc123.execute-api.ap-south-1.amazonaws.com`)
- `VITE_SOCKET_URL` = `https://socket.engage-sphere.in` (your shared EC2
  subdomain)
- `VITE_AGORA_APP_ID` (optional fallback)
- `VITE_GIPHY_API_KEY` (optional)

## Backend — REST API (Lambda)

### One-time AWS prep

1. **IAM user** with programmatic access — `AdministratorAccess` or scoped
   Serverless Framework permissions.
2. **GitHub repo secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | from IAM user |
| `AWS_SECRET_ACCESS_KEY` | from IAM user |
| `AWS_REGION` | optional, defaults to `ap-south-1` |
| `DOPPLER_TOKEN_BACKEND` | Doppler service token scoped to `engagesphere-be / prd` (read-only) |

### Running a release

GitHub → **Actions** → **Build & Release — backend (AWS Lambda)** → **Run workflow**

- `stage`: `production` or `staging`
- `confirm`: type `release`

The workflow runs:
1. `npm ci --omit=dev` in `backend/`
2. `npm i -g serverless@3`
3. install Doppler CLI
4. `doppler run --preserve-env -- serverless deploy --stage <stage>`

After the first successful deploy, copy the API endpoint URL Serverless
prints (looks like `https://abc123.execute-api.ap-south-1.amazonaws.com`)
and put it in `engagesphere-fe / prd` → `VITE_API_URL`. Then redeploy the
frontend (push any commit to main, or trigger the workflow manually).

## Backend — Socket.IO (shared EC2)

### Adding EngageSphere to the existing ClickAndCare EC2

```bash
ssh ec2-user@<ec2 ip>
cd ~/apps   # or wherever ClickAndCare lives
git clone https://github.com/anshu-man26/EngageSphere.git
cd EngageSphere/backend
npm ci --omit=dev
mkdir -p logs
```

Doppler is already installed (used by ClickAndCare). Link this folder:

```bash
doppler setup    # pick engagesphere-be / prd
```

EngageSphere defaults to port `5050` (vs ClickAndCare's `3000`). Verify or
set:

```bash
doppler secrets set PORT=5050
```

Start with PM2:

```bash
doppler run --command "pm2 start ecosystem.config.cjs"
pm2 save
```

PM2 startup is already configured for the box (ClickAndCare set it up);
the new process is captured by `pm2 save`'s snapshot.

### Caddy / nginx for `socket.engage-sphere.in`

Pick whichever the box already runs. Caddy example — append to
`/etc/caddy/Caddyfile`:

```caddyfile
socket.engage-sphere.in {
    reverse_proxy localhost:5050 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto https
    }
}
```

Then:

```bash
sudo systemctl reload caddy
```

Caddy auto-issues TLS in ~30s. Test:

```bash
curl https://socket.engage-sphere.in/api/health
```

DNS: add `A  socket.engage-sphere.in  →  <EC2 IP>` at your registrar before
running the Caddy reload.

### Updating after a code push

```bash
ssh ec2-user@<ec2 ip>
cd ~/apps/EngageSphere && git pull
cd backend && npm ci --omit=dev
pm2 restart engagesphere-backend
```

## Frontend — Vercel

Already auto-deploys on push to main via
`.github/workflows/deploy-frontend.yml`. Doppler→Vercel integration syncs
env vars, so just keep `engagesphere-fe / prd` up to date.

## Caveats

- **API Gateway payload limit:** 10 MB. Cloudinary uploads cap at 5 MB,
  safe.
- **Lambda timeout:** 29 s (API Gateway hard cap 30 s).
- **Mongo timeouts:** `serverSelectionTimeoutMS: 5000`,
  `bufferCommands: false` — requests fail fast (5 s) if Mongo is down
  instead of hitting the 29 s Lambda cap.
- **Real-time push from Lambda:** any controller that calls
  `io.to(...).emit(...)` from a Lambda invocation hits the no-op stub in
  `socket/socket.js` — the message is saved, but recipients don't get a
  live push from that path. Real-time chat flows through the EC2 socket
  server (the frontend opens its WebSocket directly there via
  `VITE_SOCKET_URL`).
- **CORS on the socket host:** the EC2 socket server's CORS allow-list
  reads `FRONTEND_URL` from the env, so make sure that's set correctly
  in the Doppler config used on EC2.
