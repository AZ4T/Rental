# TURN/STUN server (coturn)

WebRTC peer connections fail behind symmetric NATs and strict corporate
firewalls when only STUN is available. coturn relays the media stream over
TCP/443-equivalent ports so it can punch through.

## What this directory contains

- `turnserver.conf` — coturn config tuned for `turn.rental.bolatbekov.com`,
  short-term HMAC auth, Let's Encrypt TLS.
- `install.sh` — one-shot bootstrap for Ubuntu 22.04+: installs coturn +
  certbot, drops the conf, requests the cert, enables auto-reload on renew.

## Deployment

### 1. DNS

In your DNS provider, point `turn.rental.bolatbekov.com` at the droplet IP
(`207.154.199.80`, A record). Verify:

```
dig +short turn.rental.bolatbekov.com
# → 207.154.199.80
```

### 2. DigitalOcean firewall

Add inbound rules to the droplet's Cloud Firewall (or `ufw` if managed
manually):

| Port range | Proto | Source |
|------------|-------|--------|
| 3478       | TCP+UDP | All IPv4 + IPv6 |
| 5349       | TCP   | All IPv4 + IPv6 |
| 49160-49200| UDP   | All IPv4 + IPv6 |

### 3. Pick the shared secret

```
openssl rand -hex 32
```

Add this same value to:
- The droplet's backend `.env` as `TURN_SHARED_SECRET=...`
- The install prompt below (or paste into `install.sh` env)

### 4. Run installer on the droplet

```bash
ssh root@207.154.199.80
cd /root/diplom-rental    # wherever you cloned it
git pull
bash deploy/turn/install.sh
```

Walk through the prompts. The script:
1. `apt install coturn certbot`
2. Writes `/etc/turnserver.conf` with the secret substituted
3. Requests an LE cert via `certbot --standalone` (needs port 80 free briefly)
4. Symlinks fullchain/privkey into `/etc/turnserver/`
5. Installs an LE renewal hook so coturn reloads when the cert rotates
6. Enables + starts the coturn systemd service

### 5. Restart the backend

```bash
cd /root/diplom-rental
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build backend
```

The new env var is wired in `docker-compose.prod.yml`. Verify the endpoint:

```bash
curl -H "Authorization: Bearer <any user JWT>" https://rental.bolatbekov.com/api/calls/ice-servers
```

Should return `{"iceServers":[...], "ttl":3600}` with a turn entry.

## Testing without an app

Use Google's trickle-ICE tool: <https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/>

1. Hit `/calls/ice-servers` to grab a `username`/`credential` pair.
2. Add `turn:turn.rental.bolatbekov.com:3478?transport=udp` with that pair.
3. Click "Gather candidates" — you should see one of type `relay`.

If you only see `host` and `srflx`, TURN isn't reachable from your network.
Check the firewall and `journalctl -u coturn -n 200`.

## Cert renewal

Certbot's systemd timer (`certbot.timer`) renews automatically. Our deploy
hook (`/etc/letsencrypt/renewal-hooks/deploy/coturn-reload.sh`) reloads
coturn after each renewal. No cron needed.

## Common issues

- **No relay candidates locally** — your ISP may block UDP 3478. Falls back
  to TCP on the same port, then to TLS on 5349 automatically.
- **`Failed authorize` in coturn logs** — `TURN_SHARED_SECRET` on backend
  doesn't match `static-auth-secret` in `/etc/turnserver.conf`.
- **`Wrong realm`** — backend `realm` must equal coturn's
  `realm=rental.bolatbekov.com` (no `turn.` prefix; the realm is the parent
  domain).
- **Cert read errors** — coturn runs as user `turnserver`. Make sure
  `/etc/letsencrypt/live/` and `archive/` directories are mode 755 (the
  installer fixes this).
