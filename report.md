# Code Review Report

Date: 2026-05-23 (อัปเดตจาก 2026-05-22)

## Summary

ระบบ MIS กีฬา 329 ชาวจีนยูนาน รองรับ multi-project, **ผู้ใช้ 30 บัญชี**, mobile-first UI, ข้อความภาษาไทย, ส่งออกภารกิจ, แก้ไขงบฝ่ายการเงิน, แจ้งเตือน in-app, ตรวจหลักฐานตามขอบเขตคณะ และกฎปิดงาน DONE (หลักฐานอนุมัติ + ผู้ตรวจ + verified 100%)

## Features Added (2026-05-22 / 23)

### CRUD ความเสี่ยง / การประชุม / Audit log (2026-05-23)

- `/risks` + `RiskManager` + `/api/risks`
- `/meetings` + `MeetingManager` + `/api/meetings`
- `/audit-log` + `AuditLogViewer` + `/api/audit-logs`
- RBAC: `risk:manage`, `meeting:manage`, `audit:view`

## Features Added (2026-05-22)

### PRD checklist

- `docs/PRD.md` — checklist จาก nav + schema พร้อมสถานะ ✅/❌

### งบประมาณ

- `PATCH /api/budget/items/[id]` — แก้ actual/approved/requested/status/receipt
- `rollupBudgetTotals` — รวมยอดขึ้น `Project` และ `Committee`
- `BudgetItemEditor` บนหน้า `/budget` สำหรับผู้มีสิทธิ์ (Finance Officer, admin, สมาชิกคณะงบประมาณ)
- Seed: `ng_lead` / `ng_staff` ได้ role `Finance Officer` เพิ่ม

### แจ้งเตือน

- `NotificationBell` ใน header — โหลด `/api/notifications`, mark read, รีเฟรชหลังอัปโหลด/ปฏิเสธ
- สร้างแจ้งเตือนเมื่อ: อัปโหลดหลักฐาน, ปฏิเสธหลักฐาน (พร้อมเหตุผล), ภารกิจเปลี่ยนเป็น `DELAYED`

### ตรวจหลักฐาน

- `POST /api/evidence/review` — `canReviewEvidence()` กรอง `committee_id` (ยกเว้น global admin)
- หน้า `/evidence` แสดงปุ่มอนุมัติ/ปฏิเสธเฉพาะคณะที่มีสิทธิตรวจ

### ปิดงาน DONE

- `canMarkDone()` + `TaskDoneChecklist` — หลักฐานอนุมัติ, มี reviewer, `verified_progress` = 100%
- API `PATCH /api/tasks/[id]` คืน 409 ถ้ายังไม่ครบเงื่อนไข

### Middleware

- เพิ่ม `/profile`, `/admin`, `/api/budget`, `/api/notifications`, `/api/users`, `/api/projects`

## Bugs Found And Fixed (prior sessions)

รายละเอียดเดิมยังใช้ได้ — placeholder buttons, mojibake, session audit, `canMarkDone` stale progress, progress validation, upload limits

รายงานฉบับ 2026-05-21 อ้างผู้ใช้ 4 คน (`data01`/`data02`) และ unit tests 8 รายการ — **ล้าสมัย** ดูส่วน Real Data / Verification ด้านล่าง

## Real Data Verified

หลัง seed (`edition-2570`):

| Entity | ประมาณ |
|--------|--------|
| Projects | 2 (`edition-2570` + `edition-2571-demo`) |
| Committees | 14 ต่อโปรเจกต์หลัก |
| Tasks | 43 |
| Subtasks | 334+ |
| Risks | 12 |
| Budget items | 22 |
| Evidence | 18 |
| **Users** | **30** (28 ฝ่าย × 2 คน + `director` + `admin`) |

### บัญชีทดสอบ (30 บัญชี)

| บัญชี | รหัสผ่าน | หมายเหตุ |
|--------|----------|----------|
| `director` | `password123` | Project Director + Secretary |
| `admin` | `admin123` | Super Admin |
| `{abbr}_lead` / `{abbr}_staff` | `Pass329!` | 28 บัญชีฝ่าย — ดู `docs/USERS.md` |
| `ng_lead` / `ng_staff` | `Pass329!` | ฝ่ายการเงิน + Finance Officer |

ตัวอย่างฝ่าย: `kl_lead`, `kl_staff` (กีฬา), `ng_lead`, `ng_staff` (งบประมาณ)

## Verification (Self-run 2026-05-23)

รายงานฉบับเต็ม: [`docs/localhost-test-report.md`](docs/localhost-test-report.md)

```bash
npm test
npm run build
npm run start   # http://localhost:3000
```

| รายการ | ผลลัพธ์ |
|--------|---------|
| Unit tests | **42/42 ผ่าน** (10 ไฟล์, Vitest ~3s) |
| Production build | ผ่าน (หลัง clean `.next`) |
| Localhost HTTP smoke | **12/12 ผ่าน** (`/login` 200, MIS routes 307, NextAuth 200) |
| Seed | รองรับ 30 users + โปรเจกต์หลัก (ไม่ได้รันซ้ำในรอบนี้) |

### รายการ unit tests (42)

| ไฟล์ | จำนวน |
|------|--------|
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

### Localhost smoke (ไม่ตาม redirect)

| Path | HTTP | สถานะ |
|------|------|--------|
| `/login` | 200 | ✅ |
| `/`, `/dashboard`, `/risks`, `/meetings`, `/audit-log`, `/budget`, `/tasks`, `/evidence`, `/committees` | 307 | ✅ |
| `/api/audit-logs` | 307 | ✅ |
| `/api/auth/providers` | 200 | ✅ |

**หมายเหตุการรัน:** เซิร์ฟเวอร์เดิมบนพอร์ต 3000 คืน 500 เพราะ `.next` ขาด `vendor-chunks` — แก้ด้วยลบ `.next` + build ใหม่

## Known Gaps

- แจ้งเตือนอัปโหลดหลักฐานเป็น broadcast ทั้งโปรเจกต์ (ยังไม่จำกัดเฉพาะผู้ตรวจ)
- Dedupe แจ้งเตือนงานล่าช้าซ้ำต่อ task
- ไม่มี E2E (Playwright) — smoke เป็น HTTP status เท่านั้น
