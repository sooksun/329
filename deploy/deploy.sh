#!/usr/bin/env bash
###############################################################################
# Deploy script — กีฬา 329 MIS (Next.js + Prisma/MySQL + PM2)
#
# เซิร์ฟเวอร์ Linux ที่ต้องมีก่อน:
#   - Node.js 20 LTS + npm
#   - PM2          : npm i -g pm2
#   - (ถ้าใช้คิวรายงาน) Redis ที่ 127.0.0.1:6379
#                    เช่น: docker compose up -d redis   หรือ   apt install redis-server
#   - โค้ดอยู่ที่ /DATA/AppData/www/329 และมีไฟล์ .env.production (กรอกรหัสจริงแล้ว)
#
# การใช้งาน:
#   cd /DATA/AppData/www/329
#   bash deploy/deploy.sh
#
# ครั้งแรกสุด (ฐานข้อมูลว่าง) — หลังรันสคริปต์นี้แล้ว seed ข้อมูลตั้งต้น 1 ครั้ง:
#   npm run db:seed
###############################################################################
set -euo pipefail

APP_DIR="/DATA/AppData/www/329"
cd "$APP_DIR"

echo "==> [1/7] ตรวจ .env.production"
if [ ! -f .env.production ]; then
  echo "!! ไม่พบ .env.production ใน $APP_DIR — สร้างและกรอกค่าก่อน deploy" >&2
  exit 1
fi

# ดึง DATABASE_URL จาก .env.production ให้ Prisma ใช้ (Prisma อ่าน .env ปกติ ไม่อ่าน .env.production)
DATABASE_URL="$(grep -E '^DATABASE_URL=' .env.production | head -1 | cut -d= -f2- | sed -e 's/^[[:space:]]*//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
export DATABASE_URL
export NODE_ENV=production
if [ -z "$DATABASE_URL" ]; then
  echo "!! DATABASE_URL ว่างใน .env.production" >&2
  exit 1
fi

echo "==> [2/7] ติดตั้ง dependencies (npm ci)"
npm ci

echo "==> [3/7] prisma generate"
npx prisma generate

echo "==> [4/7] sync schema เข้าฐานข้อมูล (prisma db push)"
# db push จะสร้าง/อัปเดตตารางให้ตรง schema — จะหยุดเองถ้าจะทำให้ข้อมูลหาย (ไม่ใส่ --accept-data-loss เพื่อความปลอดภัย)
npx prisma db push

echo "==> [5/7] build (next build)"
npm run build

echo "==> [6/7] เตรียมโฟลเดอร์ storage/logs"
mkdir -p "$APP_DIR/storage/uploads" "$APP_DIR/storage/backups" "$APP_DIR/storage/logs"

echo "==> [7/7] (re)start ด้วย PM2"
if pm2 describe 329-web >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo "==> เสร็จสิ้น ✓  ตรวจสถานะ: pm2 status | ดู log: pm2 logs 329-web"
