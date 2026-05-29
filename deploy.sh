#!/bin/bash
set -e

DOMAIN="rental.bolatbekov.com"
EMAIL="bolatbekov718@gmail.com"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Rental deployment: $DOMAIN ==="

# 1. Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "→ Installing certbot..."
    apt-get update -q && apt-get install -y certbot
fi

# 2. Get SSL certificate (skip if already exists)
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "→ Obtaining SSL certificate for $DOMAIN..."
    # Stop nginx if running on port 80 (standalone mode needs port 80 free)
    docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" stop nginx 2>/dev/null || true
    certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN"
    echo "✓ Certificate obtained"
else
    echo "→ Certificate already exists, skipping..."
fi

# 3. Build and start all services
echo "→ Building and starting services..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "✓ Deployed successfully!"
echo "  Frontend:  https://$DOMAIN"
echo "  API:       https://$DOMAIN:8443/api"
echo "  Mobile:    https://$DOMAIN:8443"
