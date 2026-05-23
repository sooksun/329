# Localhost Test Report — MIS 329

| ฟิลด์ | ค่า |
|--------|-----|
| วันที่รัน | 2026-05-23 |
| โปรเจกต์ | `d:\laragon\www\329` |
| Base URL | http://localhost:3000 |
| โหมดเซิร์ฟเวอร์ | `npm run build` → `npm run start` (Next.js 15.5.18) |
| รันทดสอบโดย | Agent (automated) |

---

## สรุปผล

| ชุดทดสอบ | ผล | หมายเหตุ |
|----------|-----|----------|
| Unit tests (`npm test`) | **42/42 ผ่าน** | Vitest 3.2.4, ~3s |
| Production build (`npm run build`) | **ผ่าน** | หลังลบ `.next` แล้ว build ใหม่ |
| HTTP smoke (localhost) | **12/12 ผ่าน** | หลัง rebuild + restart server |

---

## 1. Unit tests

```text
Test Files  10 passed (10)
     Tests  42 passed (42)
  Duration  ~3s
```

| ไฟล์ | จำนวนเทสต์ |
|------|-------------|
| `tests/rules.test.ts` | 9 |
| `tests/rbac.test.ts` | 9 |
| `tests/event-calendar.test.ts` | 5 |
| `tests/phase3-tenant.test.ts` | 5 |
| `tests/phase2-infra.test.ts` | 4 |
| `tests/task-export.test.ts` | 3 |
| `tests/budget-transactions.test.ts` | 2 |
| `tests/notifications-dispatch.test.ts` | 2 |
| `tests/committee-access.test.ts` | 2 |
| `tests/budget-rollup.test.ts` | 1 |
| **รวม** | **42** |

คำสั่ง: `npm test`

---

## 2. Production build

- คอมไพล์และ type-check ผ่าน
- สร้าง static/dynamic routes 34 หน้า (รวม `/audit-log`, `/api/risks`, `/api/meetings`, `/api/audit-logs`)

คำสั่ง: `npm run build`

---

## 3. HTTP smoke — localhost:3000

ทดสอบด้วย `Invoke-WebRequest` (ไม่ตาม redirect) หลัง:

1. ลบโฟลเดอร์ `.next` ที่เสีย (ขาด `vendor-chunks` → `/login` คืน 500)
2. `npm run build`
3. `npm run start -p 3000`

| Path | HTTP | ผ่าน | คาดหวัง |
|------|------|------|---------|
| `/login` | 200 | ✅ | หน้า login โหลดได้ |
| `/` | 307 | ✅ | redirect |
| `/dashboard` | 307 | ✅ | middleware → login |
| `/risks` | 307 | ✅ | ต้อง login |
| `/meetings` | 307 | ✅ | ต้อง login |
| `/audit-log` | 307 | ✅ | ต้อง login |
| `/budget` | 307 | ✅ | ต้อง login |
| `/tasks` | 307 | ✅ | ต้อง login |
| `/evidence` | 307 | ✅ | ต้อง login |
| `/committees` | 307 | ✅ | ต้อง login |
| `/api/audit-logs` | 307 | ✅ | ต้อง session |
| `/api/auth/providers` | 200 | ✅ | NextAuth JSON |

**หมายเหตุ:** ไม่ได้ทดสอบ login แบบ session/cookie หรือ CRUD ผ่าน browser ในรอบนี้ — แนะนำทดสอบมือด้วย `director` / `admin` ตาม `docs/USERS.md`

---

## 4. ปัญหาที่พบระหว่างรัน

### 4.1 `.next` ไม่สมบูรณ์ → HTTP 500

**อาการ:** `/login`, `/`, `/api/auth/providers` คืน 500  
**ล็อกเซิร์ฟเวอร์:** `Cannot find module './vendor-chunks/@swc.js'` (และ chunk อื่น)

**แก้ชั่วคราว:** ลบ `.next` แล้ว `npm run build` ใหม่ก่อน `npm run start`

### 4.2 พอร์ต 3000 ถูกใช้งาน

**อาการ:** `EADDRINUSE`  
**แก้:** หยุด process ที่ listen `:3000` แล้ว start ใหม่

---

## 5. คำสั่งทำซ้ำ

```powershell
cd d:\laragon\www\329
npm test
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run start
# จากนั้นทดสอบ http://localhost:3000/login
```

---

*สร้างอัตโนมัติจากการรันทดสอบบนเครื่อง local — อัปเดตเมื่อมีการเปลี่ยนโค้ดหรือสภาพแวดล้อม*
