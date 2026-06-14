# syntax=docker/dockerfile:1
# ---------- base ----------
FROM node:20-bookworm-slim AS base
# prisma engine ต้องการ openssl; ca-certificates สำหรับ TLS
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- deps (ติดตั้งครบ รวม devDeps: ใช้ prisma CLI + tsx + tailwind ตอน build/seed/worker) ----------
# หมายเหตุ: ห้ามตั้ง NODE_ENV=production ใน stage นี้ ไม่งั้น npm ci จะข้าม devDependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate \
  && npm run build

# ---------- runner ----------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# คัดลอกแอปที่ build แล้วทั้งหมด (รวม .next, prisma, src, scripts และ node_modules
# ที่มี prisma CLI/tsx — จำเป็นสำหรับ db push, db:seed และ worker:reports)
COPY --from=builder /app ./
COPY deploy/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
