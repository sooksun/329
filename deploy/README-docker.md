# 329 MIS — ติดตั้งบน Ubuntu ด้วย Docker

Path บนเซิร์ฟเวอร์: `/DATA/AppData/www/329` · เว็บ: `http://192.168.1.4:3000`
DB: **MariaDB ภายนอก** `192.168.1.4:3306` (database `yunnansports` — มีตาราง+ข้อมูลอยู่แล้ว)

> compose นี้รันเฉพาะ **app (web + worker) + redis** และต่อ MariaDB ตัวเดิมที่มีอยู่
> ไม่สร้าง container ฐานข้อมูลใหม่ และ **ไม่ seed** (จะลบข้อมูลเดิม)

## ไฟล์ที่เกี่ยวข้อง
| ไฟล์ | หน้าที่ |
|---|---|
| `Dockerfile` | build image (Next.js + prisma CLI + tsx + worker) |
| `docker-compose.prod.yml` | services: `redis` · `web` · `worker` (ต่อ DB ภายนอก) |
| `deploy/docker-entrypoint.sh` | (ออปชัน) `prisma db push` เมื่อ `RUN_DB_PUSH=true` |
| `deploy/docker-install.sh` | สคริปต์ติดตั้ง/อัปเดตบน Ubuntu |
| `.env.production.example` | เทมเพลตค่า env (คัดลอกเป็น `.env.production`) |

## ขั้นตอนติดตั้ง

```bash
# 1) วางโค้ดที่ path นี้
cd /DATA/AppData/www/329          # git clone ... 329  หรือ คัดลอกไฟล์มาไว้

# 2) สร้าง .env.production แล้วกรอก DB USER/PASSWORD + NEXTAUTH_SECRET เอง
cp .env.production.example .env.production
nano .env.production

# 3) ติดตั้ง (build + start redis, web, worker — ต่อ MariaDB เดิม)
bash deploy/docker-install.sh
```

DB มี schema + ข้อมูลอยู่แล้ว → **ไม่ต้อง push และไม่ต้อง seed**

## ค่า .env.production สำคัญ
```ini
DB_HOST=192.168.1.4
DB_NAME=yunnansports
DB_USER=...                       # กรอกเอง
DB_PASS=...                       # กรอกเอง
DATABASE_URL="mysql://USER:PASSWORD@192.168.1.4:3306/yunnansports"
NEXTAUTH_SECRET=...               # openssl rand -base64 32
NEXTAUTH_URL=http://192.168.1.4:3000
REDIS_URL=redis://redis:6379
```
> Prisma provider เป็น `mysql` — ใช้กับ **MariaDB** ได้ (wire-compatible)
> ถ้า container ต่อ `192.168.1.4:3306` ไม่ติด ให้ลองเปลี่ยน host ใน `DATABASE_URL` เป็น `host.docker.internal:3306` (มี `extra_hosts` ตั้งไว้ให้แล้ว)

## คำสั่งใช้บ่อย
```bash
C="docker compose --env-file .env.production -f docker-compose.prod.yml"
$C ps                 # สถานะ
$C logs -f web        # ดู log เว็บ
$C logs -f worker     # ดู log worker
$C restart web worker # รีสตาร์ท
$C down               # หยุด (DB ภายนอกไม่ถูกแตะ)
git pull && $C up -d --build   # อัปเดตเวอร์ชันใหม่
```

## เมื่อแก้ Prisma schema (เพิ่ม/แก้ตาราง)
```bash
# apply เข้า DB เดิม (ไม่ลบข้อมูล)
docker compose --env-file .env.production -f docker-compose.prod.yml exec web npx prisma db push
```

## ⚠️ ข้อควรระวัง
- **ห้าม** `npm run db:seed` บน DB ที่มีข้อมูลแล้ว — มันลบข้อมูลทั้งหมดแล้วสร้างใหม่ (ใช้เฉพาะ DB ว่าง)
- `NEXTAUTH_SECRET` ต้องสุ่มใหม่ ไม่ซ้ำกับ dev
- แนะนำวาง reverse proxy (Nginx/Caddy) ครอบ HTTPS แล้วตั้ง `NEXTAUTH_URL=https://...` (ให้ session cookie เป็น Secure)
- สำรอง DB ก่อนอัปเดต schema ทุกครั้ง
