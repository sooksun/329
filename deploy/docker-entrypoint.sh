#!/bin/sh
set -e

echo "[entrypoint] 329 MIS — RUN_DB_PUSH=${RUN_DB_PUSH:-false} RUN_SEED=${RUN_SEED:-false}"

# ⚠️ ค่าเริ่มต้น false: DB production มีตารางนอก Prisma (`calendar`) ที่ db push จะ DROP ทิ้ง
# เปลี่ยน schema ให้ใช้ prisma/manual-migrations/*.sql — เปิด true เฉพาะ DB ใหม่ที่ว่างเปล่าเท่านั้น
if [ "${RUN_DB_PUSH:-false}" = "true" ]; then
  echo "[entrypoint] prisma db push ..."
  npx prisma db push --skip-generate
fi

# seed ข้อมูลตั้งต้น — ⚠️ ลบข้อมูลเดิมทั้งหมด ใช้เฉพาะตอน setup ครั้งแรก (ตั้ง RUN_SEED=true)
# seed จะปฏิเสธถ้า DB มีผู้ใช้อยู่แล้วหรือเป็น production เว้นแต่ตั้ง SEED_CONFIRM=WIPE_ALL_DATA
# และบน production ต้องตั้ง SEED_ADMIN_PASSWORD / SEED_DIRECTOR_PASSWORD / SEED_MEMBER_PASSWORD
if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "[entrypoint] db:seed (DESTRUCTIVE reset) ..."
  npm run db:seed
fi

exec "$@"
