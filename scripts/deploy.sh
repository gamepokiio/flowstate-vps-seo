#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# scripts/deploy.sh — Deploy / Update FlowState
# Dùng lần đầu và mỗi khi update code
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e
cd /opt/flowstate

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

echo ""
echo "🚀 FlowState Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kiểm tra .env tồn tại
if [ ! -f .env ]; then
  echo "❌ File .env không tồn tại!"
  echo "   Chạy: cp .env.example .env && nano .env"
  exit 1
fi

# ── Pull code mới nhất ─────────────────────────────
info "Pull code từ GitHub..."
git pull origin main
log "Code updated"

# ── Build Docker images ────────────────────────────
info "Build Docker images..."
docker-compose build --no-cache app
log "Images built"

# ── Zero-downtime restart ──────────────────────────
info "Restart services..."

# Khởi động DB & Redis trước (nếu chưa chạy)
docker-compose up -d postgres redis
sleep 5

# Migrate database
info "Chạy database migrations..."
docker-compose run --rm app npx prisma migrate deploy
log "Database migrated"

# Restart app với image mới
docker-compose up -d --force-recreate app nginx
log "App restarted"

# ── Health check ───────────────────────────────────
info "Kiểm tra health..."
sleep 10  # Chờ app khởi động

MAX_RETRIES=12
for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || echo "000")
  if [ "$STATUS" = "200" ]; then
    log "Health check passed! (HTTP 200)"
    break
  fi
  warn "Chờ app khởi động... ($i/$MAX_RETRIES)"
  sleep 5
done

if [ "$STATUS" != "200" ]; then
  echo "❌ Health check thất bại!"
  echo "   Xem logs: docker-compose logs app"
  exit 1
fi

# ── Cleanup ────────────────────────────────────────
info "Dọn dẹp Docker images cũ..."
docker image prune -f
log "Cleanup done"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🎉 Deploy thành công!"
echo ""
docker-compose ps
