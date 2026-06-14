#!/usr/bin/env bash
# ติดตั้ง/อัปเดต 329 MIS บน Ubuntu ด้วย Docker
# ใช้:  cd /DATA/AppData/www/329 && bash deploy/docker-install.sh
set -euo pipefail

APP_DIR="/DATA/AppData/www/329"
ENV_FILE="$APP_DIR/.env.production"
COMPOSE="docker compose --env-file $ENV_FILE -f $APP_DIR/docker-compose.prod.yml"

echo "==> 329 MIS — Docker deploy ที่ $APP_DIR"

# 1) ต้องมี Docker Engine + compose plugin
if ! command -v docker >/dev/null 2>&1; then
  echo "==> ไม่พบ Docker — กำลังติดตั้ง Docker Engine..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker || true
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: ไม่พบ 'docker compose' plugin — ติดตั้ง: apt-get install -y docker-compose-plugin" >&2
  exit 1
fi

# 2) ต้องอยู่ที่ APP_DIR และมี .env.production
cd "$APP_DIR"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: ไม่พบ $ENV_FILE"
  echo "       คัดลอกจากตัวอย่างแล้วกรอกค่า:  cp .env.production.example .env.production && nano .env.production"
  exit 1
fi

# 3) เตรียมโฟลเดอร์ storage (volume)
mkdir -p storage/uploads storage/backups storage/reports storage/logs

# 4) build + start (redis → web → worker) — ต่อ MariaDB ภายนอก 192.168.1.4:3306
echo "==> build & start containers (redis, web, worker)..."
$COMPOSE up -d --build

echo "==> รอแอปเริ่ม..."
sleep 5
$COMPOSE ps

cat <<EOF

==> เสร็จสิ้น
    เว็บ:     http://192.168.1.4:3000
    DB:       MariaDB ภายนอก 192.168.1.4:3306 (database: yunnansports — มีข้อมูลอยู่แล้ว)

    ⚠️  ห้ามรัน db:seed บน DB ที่มีข้อมูลแล้ว (จะลบข้อมูลทั้งหมด)
        - อัปเดต schema เมื่อแก้ Prisma:  $COMPOSE exec web npx prisma db push
        - seed ใหม่ (เฉพาะ DB ว่าง):       $COMPOSE exec web npm run db:seed

    คำสั่งที่ใช้บ่อย:
        ดู log:        $COMPOSE logs -f web
        รีสตาร์ท:       $COMPOSE restart web worker
        อัปเดตโค้ดใหม่:  git pull && $COMPOSE up -d --build
        หยุด:          $COMPOSE down
EOF
