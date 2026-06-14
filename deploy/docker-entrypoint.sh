#!/bin/sh
set -e

echo "[entrypoint] 329 MIS — RUN_DB_PUSH=${RUN_DB_PUSH:-true} RUN_SEED=${RUN_SEED:-false}"

# apply schema เข้า DB (idempotent) — เปิดเฉพาะ service web เท่านั้น (worker ตั้ง RUN_DB_PUSH=false)
if [ "${RUN_DB_PUSH:-true}" = "true" ]; then
  echo "[entrypoint] prisma db push ..."
  npx prisma db push --skip-generate
fi

# seed ข้อมูลตั้งต้น — ⚠️ ลบข้อมูลเดิมทั้งหมด ใช้เฉพาะตอน setup ครั้งแรก (ตั้ง RUN_SEED=true)
if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "[entrypoint] db:seed (DESTRUCTIVE reset) ..."
  npm run db:seed
fi

exec "$@"
