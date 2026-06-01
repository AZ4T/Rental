#!/usr/bin/env bash
# Install coturn on the droplet. Run as root on Ubuntu 22.04+.
#
# Prerequisites:
#   1. DNS A record turn.rental.bolatbekov.com → 207.154.199.80
#      (verify with `dig +short turn.rental.bolatbekov.com`)
#   2. Ports open in the DigitalOcean Cloud Firewall (see README):
#        3478 udp+tcp, 5349 tcp, 49160-49200 udp
#   3. TURN_SHARED_SECRET picked (e.g. `openssl rand -hex 32`),
#      saved into the backend's .env as TURN_SHARED_SECRET=...
#      The script will prompt for it.

set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo bash $0" >&2
  exit 1
fi

read -rp "TURN shared secret (paste same value as backend .env): " SECRET
if [[ -z "$SECRET" ]]; then
  echo "Empty secret — abort." >&2
  exit 1
fi

DOMAIN="turn.rental.bolatbekov.com"
CONF_SRC="$(dirname "$(readlink -f "$0")")/turnserver.conf"

echo ">> Installing packages…"
apt update
apt install -y coturn certbot

echo ">> Enabling coturn daemon…"
sed -i 's/^#\?TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn

echo ">> Writing /etc/turnserver.conf…"
install -m 640 -o root -g turnserver "$CONF_SRC" /etc/turnserver.conf
sed -i "s|\${TURN_SHARED_SECRET}|$SECRET|" /etc/turnserver.conf

mkdir -p /var/log/turnserver
chown turnserver:turnserver /var/log/turnserver

echo ">> Requesting Let's Encrypt cert for $DOMAIN…"
# `--standalone` needs port 80 free for a few seconds — stop nginx if it's
# bound to 0.0.0.0:80 on the host. If nginx is in Docker, this is fine.
certbot certonly --non-interactive --agree-tos --register-unsafely-without-email \
  --standalone -d "$DOMAIN"

echo ">> Symlinking cert into /etc/turnserver/…"
mkdir -p /etc/turnserver
ln -sf "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" /etc/turnserver/cert.pem
ln -sf "/etc/letsencrypt/live/$DOMAIN/privkey.pem" /etc/turnserver/pkey.pem
# coturn runs as `turnserver`, give it traversal rights through LE dirs
# AND read access to the actual privkey file (LE defaults to 600/root-only).
chmod 755 /etc/letsencrypt/{live,archive}
chmod 755 "/etc/letsencrypt/live/$DOMAIN" "/etc/letsencrypt/archive/$DOMAIN"
chmod 644 "/etc/letsencrypt/archive/$DOMAIN"/privkey*.pem

echo ">> Auto-reload coturn after cert renewal…"
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/coturn-reload.sh <<'HOOK'
#!/usr/bin/env bash
systemctl reload coturn || systemctl restart coturn
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/coturn-reload.sh

echo ">> Starting coturn…"
systemctl enable --now coturn
systemctl restart coturn

echo
echo ">> Done. Verify:"
echo "   sudo systemctl status coturn"
echo "   sudo journalctl -u coturn -n 50"
echo "   nc -zv $DOMAIN 3478"
echo "   nc -zv $DOMAIN 5349"
echo
echo "Test with https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/"
echo "Add: turn:$DOMAIN:3478?transport=udp  +  username/password from /calls/ice-servers"
