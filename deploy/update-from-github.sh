#!/usr/bin/env bash
###############################################################################
# อัปเดต 329 MIS บนเซิร์ฟเวอร์จาก GitHub แล้ว rebuild Docker (web + worker)
#
# ใช้งาน (บนเซิร์ฟเวอร์ ในฐานะ root):
#   cd /DATA/AppData/www/329
#   bash deploy/update-from-github.sh
#
# ครั้งแรก (ถ้ายังไม่ได้วางสคริปต์นี้ไว้บนเซิร์ฟเวอร์) ดาวน์โหลดแล้วรันได้เลย:
#   curl -fsSL https://raw.githubusercontent.com/sooksun/329/master/deploy/update-from-github.sh -o /tmp/update-329.sh
#   bash /tmp/update-329.sh
#
# สิ่งที่สคริปต์ทำ:
#   1) สำรองโค้ดปัจจุบัน (ไม่รวม node_modules/.next/storage) ไว้ที่ $BACKUP_DIR
#   2) ถ้าโฟลเดอร์ยังไม่เป็น git repo → แปลงเป็น git clone ของ GitHub (ครั้งแรกครั้งเดียว)
#      ถ้าเป็นแล้ว → fetch + อัปเดตเป็น origin/$BRANCH
#      - ไฟล์ที่ git ignore (.env.production, storage/uploads, storage/reports ฯลฯ) ไม่ถูกแตะ
#      - ไม่รัน git clean — ไฟล์อื่นที่ไม่อยู่ใน repo จะยังอยู่ครบ
#      - ไฟล์ที่ต่างจาก GitHub จะถูกบันทึกรายชื่อไว้ใน backup ก่อนเขียนทับ
#   3) docker compose up -d --build (เฉพาะ container ของ 329: redis, web, worker)
#
# สิ่งที่สคริปต์ "ไม่" ทำ:
#   - ไม่เปลี่ยน port / firewall (ใช้ WEB_PORT เดิมใน .env.production)
#   - ไม่แตะฐานข้อมูล (ไม่ prisma db push, ไม่ seed, ไม่ migrate)
#   - ไม่ลบ image/container ของแอปอื่นบนเครื่อง
###############################################################################
set -euo pipefail

APP_DIR="${APP_DIR:-/DATA/AppData/www/329}"
REPO_URL="${REPO_URL:-https://github.com/sooksun/329.git}"
BRANCH="${BRANCH:-master}"
ENV_FILE="${ENV_FILE:-.env.production}"
BACKUP_DIR="${BACKUP_DIR:-/DATA/AppData/backup/329}"
TS="$(date +%Y%m%d-%H%M%S)"

# โฟลเดอร์อาจเป็นของ user อื่น — อนุญาตเฉพาะคำสั่งนี้ ไม่แก้ git config ของเครื่อง
g() { git -c safe.directory="$APP_DIR" -C "$APP_DIR" "$@"; }

step() { echo; echo "==> $*"; }
die() { echo "!! $*" >&2; exit 1; }

command -v git >/dev/null || die "ไม่พบ git — ติดตั้ง: apt-get install -y git"
docker compose version >/dev/null 2>&1 || die "ไม่พบ 'docker compose' — ติดตั้ง: apt-get install -y docker-compose-plugin"
[ -d "$APP_DIR" ] || die "ไม่พบโฟลเดอร์ $APP_DIR"
cd "$APP_DIR"
[ -f "$ENV_FILE" ] || die "ไม่พบ $APP_DIR/$ENV_FILE — สร้างจาก .env.production.example ก่อน"

# ---- ตรวจ port ก่อนทำอะไร (เซิร์ฟเวอร์มีหลายแอป — ห้ามเดา port) ----
WEB_PORT="$(grep -E '^WEB_PORT=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"'"'"' \r' || true)"
[ -n "$WEB_PORT" ] || die "ยังไม่ได้ตั้ง WEB_PORT ใน $ENV_FILE (server จริงใช้ 9990 — 3000 มีแอปอื่นใช้อยู่)
   ตั้ง port ที่ 329 ใช้อยู่เดิม เช่น:  echo 'WEB_PORT=9990' >> $APP_DIR/$ENV_FILE"
case "$WEB_PORT" in *[!0-9]*) die "WEB_PORT ต้องเป็นตัวเลข (ตอนนี้: $WEB_PORT)";; esac
# port ต้องว่าง หรือถูกใช้โดย container ของ 329 เอง (yunnansports-web) เท่านั้น
PORT_OWNER="$(docker ps --format '{{.Names}} {{.Ports}}' | grep -E "[:]${WEB_PORT}->" | awk '{print $1}' | grep -v '^yunnansports-web$' || true)"
[ -z "$PORT_OWNER" ] || die "port $WEB_PORT ถูก container อื่นใช้อยู่: $PORT_OWNER — ตรวจ WEB_PORT ใน $ENV_FILE"
if ! docker ps --format '{{.Names}} {{.Ports}}' | grep -qE "^yunnansports-web .*[:]${WEB_PORT}->" \
   && command -v ss >/dev/null && ss -ltnH "( sport = :$WEB_PORT )" | grep -q .; then
  die "port $WEB_PORT มีโปรแกรมอื่น listen อยู่ (ดู: ss -ltnp | grep :$WEB_PORT)"
fi
echo "port ที่ใช้: $WEB_PORT"

step "[1/4] สำรองโค้ดปัจจุบัน → $BACKUP_DIR/code-$TS.tgz"
mkdir -p "$BACKUP_DIR"
tar --exclude=./node_modules --exclude=./.next --exclude=./storage --exclude=./.git \
  -czf "$BACKUP_DIR/code-$TS.tgz" -C "$APP_DIR" .
echo "    เสร็จ ($(du -h "$BACKUP_DIR/code-$TS.tgz" | cut -f1))"

step "[2/4] ดึงโค้ดจาก $REPO_URL ($BRANCH)"
if [ ! -d "$APP_DIR/.git" ]; then
  echo "    โฟลเดอร์นี้ยังไม่เป็น git repo → แปลงเป็น git clone (ครั้งแรก)"
  g init -q
  g remote add origin "$REPO_URL"
else
  g remote set-url origin "$REPO_URL"
fi
g fetch -q origin "$BRANCH"
OLD_REV="$(g rev-parse -q --verify HEAD || echo none)"

# ชี้ HEAD/index ไปที่ GitHub โดยยังไม่แตะไฟล์ — เพื่อดูว่าไฟล์บนเซิร์ฟเวอร์ต่างจาก GitHub ตรงไหน
g reset -q "origin/$BRANCH"
g status --short --untracked-files=no > "$BACKUP_DIR/changed-files-$TS.txt" || true
CHANGED="$(wc -l < "$BACKUP_DIR/changed-files-$TS.txt" | tr -d ' ')"
if [ "$CHANGED" -gt 0 ]; then
  echo "    ไฟล์ที่ต่างจาก GitHub และจะถูกอัปเดต: $CHANGED ไฟล์ (รายชื่อ: $BACKUP_DIR/changed-files-$TS.txt)"
  head -20 "$BACKUP_DIR/changed-files-$TS.txt" | sed 's/^/      /'
  [ "$CHANGED" -gt 20 ] && echo "      ..."
else
  echo "    โค้ดตรงกับ GitHub อยู่แล้ว"
fi

# เขียนทับเฉพาะไฟล์ที่อยู่ใน repo (ไฟล์ ignore/untracked ไม่ถูกแตะ)
g checkout -q -f -B "$BRANCH" "origin/$BRANCH"
g branch -q --set-upstream-to="origin/$BRANCH" "$BRANCH"
NEW_REV="$(g rev-parse --short HEAD)"
echo "    เวอร์ชันตอนนี้: $(g log -1 --format='%h %s')"
[ "$OLD_REV" != "none" ] && [ "$(g rev-parse HEAD)" = "$OLD_REV" ] && [ "$CHANGED" -eq 0 ] && \
  echo "    (ไม่มีอะไรใหม่ — จะ rebuild ต่อตามปกติ)"

# สคริปต์ .sh ต้องรันได้
chmod +x deploy/*.sh 2>/dev/null || true

step "[3/4] build + start containers (redis, web, worker)"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$APP_DIR/docker-compose.prod.yml")
"${COMPOSE[@]}" up -d --build
"${COMPOSE[@]}" ps

step "[4/4] ตรวจว่าเว็บตอบ"
OK=""
for _ in $(seq 1 30); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$WEB_PORT/login" || true)"
  if [ "$CODE" = "200" ]; then OK=1; break; fi
  sleep 2
done
if [ -n "$OK" ]; then
  echo "    OK — http://127.0.0.1:$WEB_PORT/login ตอบ 200"
else
  echo "!! เว็บยังไม่ตอบ 200 ที่ port $WEB_PORT — ดู log: ${COMPOSE[*]} logs --tail=100 web" >&2
  exit 1
fi

echo
echo "เสร็จแล้ว: $NEW_REV"
echo "ย้อนกลับโค้ดเดิม (ถ้าจำเป็น): tar -xzf $BACKUP_DIR/code-$TS.tgz -C $APP_DIR แล้วรัน ${COMPOSE[*]} up -d --build"
