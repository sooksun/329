# PRD Checklist — MIS กีฬา 329 ชาวจีนยูนาน

เอกสารนี้สรุปความต้องการจาก **เมนูนำทาง (nav)** + **Prisma schema** + สถานะการ implement ในโค้ดปัจจุบัน  
ใช้เป็น checklist กันหลุด requirement — อัปเดตเมื่อมีฟีเจอร์ใหม่

**อ้างอิง:** `src/components/mis-shell.tsx`, `prisma/schema.prisma`, `docs/architecture/phase-3.md`, `docs/USERS.md`

---

## 1. ผู้ใช้และการเข้าสู่ระบบ

| # | Requirement | Route/API | Schema | สถานะ |
|---|-------------|-----------|--------|--------|
| 1.1 | Login ด้วย username/password | `/login` | `User` | ✅ |
| 1.2 | Session + RBAC ตาม Role/Permission | NextAuth | `Role`, `Permission`, `UserRole` | ✅ |
| 1.3 | ผู้ใช้ 30 บัญชี (28 ฝ่าย + director + admin) | — | `User`, `CommitteeMember` | ✅ seed |
| 1.4 | โปรไฟล์ผู้ใช้ | `/profile` | `User` | ✅ |
| 1.5 | จัดการผู้ใช้ (admin) | `/admin/users` | `User` | ✅ |
| 1.6 | Middleware ครอบ route สำคัญ | `middleware.ts` | — | ✅ (อัปเดต 2026-05) |

---

## 2. Multi-tenant / โปรเจกต์ (Phase 3)

| # | Requirement | Route/API | Schema | สถานะ |
|---|-------------|-----------|--------|--------|
| 2.1 | Organization + Project | — | `Organization`, `Project` | ✅ |
| 2.2 | เลือกโปรเจกต์ active (cookie) | `ProjectSelector`, `/api/projects/select` | `Project` | ✅ |
| 2.3 | รายการโปรเจกต์ตามสิทธิ์ | `/api/projects` | `OrganizationMember` | ✅ |
| 2.4 | โปรเจกต์หลัก `edition-2570` เป็นค่าเริ่มต้น | — | `slug` | ✅ |
| 2.5 | กรองข้อมูลตามคณะที่สมาชิกอยู่ | loaders + API | `CommitteeMember` | ✅ |

---

## 3. ภาพรวม (nav: ภาพรวม)

| # | Requirement | Route | Schema | สถานะ |
|---|-------------|-------|--------|--------|
| 3.1 | Dashboard KPI + กราฟ | `/dashboard` | `Project`, `Task`, `Evidence`, `Risk`, `BudgetItem` | ✅ อ่าน |
| 3.2 | Snapshot บันทึกภาพรวม | `/api/snapshots` | `DashboardSnapshot` | ✅ |
| 3.3 | คณะอนุกรรมการ + สมาชิก | `/committees` | `Committee`, `CommitteeMember` | ✅ อ่าน |
| 3.4 | CRUD คณะ/สมาชิกใน UI | `/committees`, `/api/committees` | `Committee`, `CommitteeMember` | ✅ |

---

## 4. การปฏิบัติงาน (nav: การปฏิบัติงาน)

| # | Requirement | Route | Schema | สถานะ |
|---|-------------|-------|--------|--------|
| 4.1 | บอร์ดภารกิจ + กรอง/ค้นหา | `/tasks` | `Task` | ✅ |
| 4.2 | รายละเอียดภารกิจ | `/tasks/detail` | `Task`, `Subtask` | ✅ |
| 4.3 | PATCH ภารกิจ (สถานะ, progress, ปิด DONE) | `/api/tasks/[id]` | `Task` | ✅ |
| 4.4 | งานย่อย + มอบหมาย owner | `/api/subtasks/[id]` | `Subtask` | ✅ |
| 4.5 | Auto `DELAYED` เมื่อเลย due | `syncDelayedTasks` | `Task` | ✅ |
| 4.6 | Rollup % จากงานย่อย | subtasks PATCH | `Subtask` | ✅ |
| 4.7 | ส่งออกภารกิจ CSV/JSON | `/tasks/export`, `/api/tasks/export` | — | ✅ |
| 4.8 | คลังหลักฐาน | `/evidence` | `Evidence`, `FileAsset` | ✅ |
| 4.9 | อัปโหลดหลักฐาน (10MB, ชนิดไฟล์) | `/api/evidence/upload` | `Evidence` | ✅ |
| 4.10 | ตรวจหลักฐาน อนุมัติ/ปฏิเสธ | `/api/evidence/review` | `Evidence` | ✅ + กรองคณะ |
| 4.11 | กำหนดการ / Gantt | `/timeline` | `Task` | ✅ อ่าน |
| 4.12 | ความคิดเห็นงาน | `/tasks/detail`, `/api/tasks/[id]/comments` | `Comment` | ✅ |
| 4.13 | ความสัมพันธ์งาน (dependency) | `/tasks/detail`, `/api/tasks/[id]/dependencies` | `TaskDependency` | ✅ |

---

## 5. การบริหาร (nav: การบริหาร)

| # | Requirement | Route | Schema | สถานะ |
|---|-------------|-------|--------|--------|
| 5.1 | งบประมาณ 3 ชั้น (โครงการ/คณะ/รายการ) | `/budget` | `BudgetItem`, `Committee`, `Project` | ✅ อ่าน |
| 5.2 | แก้ไขรายการงบ (ฝ่ายการเงิน) | `/api/budget/items/[id]` PATCH | `BudgetItem` | ✅ |
| 5.3 | Rollup ยอดงบขึ้น Project/Committee | `rollupBudgetTotals` | — | ✅ |
| 5.4 | ธุรกรรมงบรายรายการ | `/budget`, `/api/budget/items/[id]/transactions` | `BudgetTransaction` | ✅ |
| 5.5 | ความเสี่ยง + ตาราง heatmap | `/risks` | `Risk` | ✅ อ่าน |
| 5.6 | CRUD ความเสี่ยง | `/risks`, `/api/risks` | `Risk` | ✅ |
| 5.7 | การประชุม + มติ/งานติดตาม | `/meetings` | `Meeting`, `MeetingAgenda`, `MeetingActionItem` | ✅ อ่าน |
| 5.8 | CRUD การประชุม | `/meetings`, `/api/meetings` | `Meeting` | ✅ |
| 5.9 | รายงาน PowerPoint | `/reports`, `/api/reports/pptx` | `PowerPointReport`, `ReportGenerationJob` | ✅ |
| 5.10 | แผนงาน (Plan) แยกคณะ | seed | `Plan` | ✅ seed |

---

## 6. แจ้งเตือน

| # | Requirement | Route/API | Schema | สถานะ |
|---|-------------|-----------|--------|--------|
| 6.1 | รายการแจ้งเตือน + อ่านแล้ว | `/api/notifications` | `Notification` | ✅ |
| 6.2 | UI กระดิ่งใน header | `NotificationBell` | — | ✅ |
| 6.3 | แจ้งเมื่ออัปโหลดหลักฐาน | upload API | `Notification` | ✅ |
| 6.4 | แจ้งเมื่อปฏิเสธหลักฐาน | review API | `Notification` | ✅ |
| 6.5 | แจ้งเมื่องานกลายเป็นล่าช้า | `syncDelayedTasks` | `Notification` | ✅ |

---

## 7. อ้างอิง / อื่นๆ

| # | Requirement | Route | สถานะ |
|---|-------------|-------|--------|
| 7.1 | โปรไฟล์ | `/profile` | ✅ |
| 7.2 | คู่มือมือถือ | `/mobile` | ✅ |
| 7.3 | Audit log บันทึกการเปลี่ยนแปลง | `AuditLog`, `/api/audit-logs` | ✅ |
| 7.4 | หน้าดู Audit log | `/audit-log` | ✅ |
| 7.5 | Phase 2: Redis cache / BullMQ / S3 | env | ✅ ตาม config |
| 7.6 | Mobile-first shell | `mis-shell`, `page-layout` | ✅ |

---

## 8. กฎธุรกิจหลัก (Logic)

| กฎ | สถานะ |
|-----|--------|
| ปิดงาน `DONE` ต้องมีหลักฐานอนุมัติ + reviewer + verified 100% | ✅ |
| Progress 0–100 | ✅ |
| แก้งาน/อัปโหลดหลักฐาน จำกัดตามคณะ (ยกเว้น director/secretary/admin) | ✅ |
| ตรวจหลักฐาน จำกัดตามคณะ (ยกเว้น global admin) | ✅ |
| แก้งบ: `budget:manage` หรือสมาชิกคณะ「งบประมาณและการเงิน」 | ✅ |
| สถานะงานย่อย: ผู้ใช้เลือกเอง (ไม่ auto จากหลักฐาน) | ✅ by design |

---

## 9. API Write Path สรุป

| API | Permission / Scope |
|-----|-------------------|
| `PATCH /api/tasks/[id]` | committee + task update |
| `GET/POST /api/tasks/[id]/comments` | ดู/โพสต์ comment ในคณะ |
| `DELETE .../comments/[commentId]` | ผู้เขียนหรือ admin |
| `GET/POST /api/tasks/[id]/dependencies` | เพิ่มงานที่ต้องทำก่อน (กันวน) |
| `DELETE .../dependencies/[id]` | ลบความสัมพันธ์ |
| `PATCH /api/subtasks/[id]` | committee |
| `POST /api/evidence/upload` | committee |
| `POST /api/evidence/review` | `evidence:review` + committee |
| `PATCH /api/budget/items/[id]` | budget manage / finance committee |
| `GET/POST .../budget/items/[id]/transactions` | บันทึกจ่ายจริง → รวม actual |
| `DELETE .../transactions/[transactionId]` | ลบ + rollup ใหม่ |
| `GET/POST /api/committees` | committee:manage (global) |
| `PATCH/DELETE /api/committees/[id]` | committee:manage |
| `POST /api/committees/[id]/members` | committee:manage หรือ Committee Lead ในคณะ |
| `PATCH/DELETE .../members/[memberId]` | เช่นเดียวกับเพิ่มสมาชิก |
| `POST /api/snapshots` | snapshot manage |
| `POST /api/reports/pptx` | report generate |
| `GET/PATCH /api/users` | user manage |
| `GET/PATCH /api/notifications` | session + active project |
| `GET/POST /api/risks`, `PATCH/DELETE /api/risks/[id]` | `risk:manage` / Committee Lead ในคณะ |
| `GET/POST /api/meetings`, `PATCH/DELETE /api/meetings/[id]` | `meeting:manage` / admin |
| `GET /api/audit-logs` | `audit:view` / admin |

---

## 10. ลำดับงานที่แนะนำ (Gap ถัดไป)

1. ป้องกันแจ้งเตือนงานล่าช้าซ้ำ (dedupe ต่อ task)  
2. มอบ role `Evidence Reviewer` ให้หัวหน้าฝ่ายที่ต้องตรวจข้ามคณะ (ถ้าต้องการ)

---

*อัปเดตล่าสุด: 2026-05-22*
