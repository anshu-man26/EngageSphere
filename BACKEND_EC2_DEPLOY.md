# Backend deploy on existing EC2 (alongside ClickAndCare)

Goal: run EngageSphere's backend on the same EC2 instance currently hosting
ClickAndCare, behind nginx, on a new subdomain `api.engage-sphere.in`,
with TLS.

```
Browser ──https://api.engage-sphere.in──▶ nginx ──▶ engagesphere :5050
                                              ╰─▶ clickandcare  :5000
```

## 1 · DNS

In your domain registrar add:

```
A  api.engage-sphere.in  →  <EC2 elastic IP>
```

Wait a couple of minutes; verify with `dig api.engage-sphere.in`.

## 2 · SSH in and pull the code

```bash
ssh ubuntu@<your-ec2-ip>
cd ~/apps                              # or wherever ClickAndCare lives
git clone https://github.com/anshu-man26/EngageSphere.git
cd EngageSphere/backend
npm ci --omit=dev
mkdir -p logs
```

## 3 · Doppler

Install once on the box if not already there:

```bash
curl -Ls https://cli.doppler.com/install.sh | sudo sh
```

Inside `EngageSphere/backend/` link the project + config:

```bash
doppler login          # interactive, only once per box
doppler setup          # pick the engagesphere project + prd config
```

Make sure these are set in Doppler `prd`:

| Var | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_DB_URI` | your Atlas connection string |
| `JWT_SECRET` | a fresh long random string |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail + App Password |
| `CLOUDINARY_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_SECRET_KEY` | from Cloudinary |
| `AGORA_APP_ID` / `AGORA_APP_CERTIFICATE` | from Agora secured project |
| `FRONTEND_URL` | `https://www.engage-sphere.in` |

## 4 · Pick a port that doesn't clash with ClickAndCare

ClickAndCare is probably on `5000`. Use **`5050`** for EngageSphere.

```bash
doppler secrets set PORT=5050   # if not already in Doppler
```

The `ecosystem.config.cjs` defaults to `5050` if nothing is set.

## 5 · PM2

If PM2 isn't already on the box (it almost certainly is for ClickAndCare):

```bash
sudo npm install --global pm2
```

Start the EngageSphere process:

```bash
cd ~/apps/EngageSphere/backend
doppler run --command "pm2 start ecosystem.config.cjs"
pm2 save                # persist across reboots
```

Verify:

```bash
pm2 ls                  # both engagesphere-backend AND clickandcare should be listed
pm2 logs engagesphere-backend --lines 30
curl http://localhost:5050/api/health   # should return JSON status
```

## 6 · nginx — new server block

Create `/etc/nginx/sites-available/engage-sphere`:

```nginx
upstream engagesphere_backend {
    server 127.0.0.1:5050;
    keepalive 64;
}

server {
    listen 80;
    server_name api.engage-sphere.in;

    # certbot will rewrite this once TLS is issued
    location / {
        proxy_pass http://engagesphere_backend;
        proxy_http_version 1.1;

        # Required for Socket.IO websockets
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Long-lived sockets need long timeouts
        proxy_read_timeout                 86400;
        proxy_send_timeout                 86400;
    }
}
```

Enable + reload:

```bash
sudo ln -s /etc/nginx/sites-available/engage-sphere /etc/nginx/sites-enabled/
sudo nginx -t            # syntax check
sudo systemctl reload nginx
```

`curl http://api.engage-sphere.in/api/health` should now succeed (over plain http).

## 7 · TLS via Let's Encrypt

```bash
sudo certbot --nginx -d api.engage-sphere.in
```

Certbot updates the nginx config in place to add `listen 443 ssl;` plus the
cert paths and an http→https redirect. Auto-renewal is already wired by the
certbot package (cron + `certbot renew`).

## 8 · Frontend pointing

In Doppler's **engagesphere → prd** config (the one synced to Vercel), set:

```
VITE_API_URL    = https://api.engage-sphere.in
VITE_SOCKET_URL = https://api.engage-sphere.in
```

Trigger a Vercel redeploy (push any commit to main, or **Vercel dashboard
→ Deployments → … → Redeploy**). The Vite bundle now points at the new
backend.

## 9 · Verify end-to-end

| Check | How |
|---|---|
| Health | `curl https://api.engage-sphere.in/api/health` returns 200 |
| CORS | DevTools → Network on `https://www.engage-sphere.in` — no CORS errors |
| Cookie | After login, DevTools → Application → Cookies has `jwt` for `api.engage-sphere.in` with `SameSite=None; Secure` |
| Socket.IO | DevTools → Network → WS shows a `wss://api.engage-sphere.in/socket.io/...` connection in `101 Switching Protocols` state |
| Two-device sync | Open the site on two browsers, send a message — appears instantly |

## Common gotchas

- **`502 Bad Gateway` from nginx.** PM2 process isn't running or is on the
  wrong port. `pm2 ls` and `pm2 logs engagesphere-backend`.
- **Login works but `/api/users/conversations` returns 401.** The `jwt`
  cookie isn't getting through. Almost always means the app is being served
  over plain http somewhere — `sameSite=none` requires `secure` which
  requires https end-to-end.
- **Socket connects then drops every ~60s.** nginx `proxy_read_timeout`
  too low. The config above sets 24h, which is what Socket.IO docs
  recommend.
- **MongoDB Atlas refuses connection.** Whitelist the EC2's elastic IP in
  Atlas → Network Access.
- **PM2 doesn't restart on reboot.** Run once: `pm2 startup systemd` and
  paste the command it prints (it's a sudo chmod), then `pm2 save`.

## Updating after a code push

```bash
ssh ubuntu@<your-ec2-ip>
cd ~/apps/EngageSphere
git pull origin main
cd backend
npm ci --omit=dev
pm2 restart engagesphere-backend
```

Or wire this up as a tiny GitHub Actions workflow with SSH later — out of
scope for this first deploy.
