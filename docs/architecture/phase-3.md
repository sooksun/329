# Phase 3 — หลายองค์กร / หลายโปรเจกต์ (Modular Monolith)

## สิ่งที่ทำแล้ว (ใน repo นี้)

| หัวข้อ | การ implement |
|--------|----------------|
| **Tenant** | โมเดล `Organization` + `OrganizationMember` |
| **โปรเจกต์หลายรอบ** | `Project.organization_id`, `slug` ต่อองค์กร |
| **สิทธิ์เข้าถึง** | Super Admin → ทุกโปรเจกต์; Director/Secretary → ทุกโปรเจกต์ในองค์กร; สมาชิกคณะ → เฉพาะโปรเจกต์ที่มี `CommitteeMember` |
| **ตัวเลือกโปรเจกต์** | Cookie `mis_project_id` + UI `ProjectSelector` + `POST /api/projects/select` |
| **ขอบเขตคณะ** | `getCommitteeAccessContext(user, projectId)` กรอง committee ตามโปรเจกต์ที่เลือก |
| **Report / Notification** | โมดูล `src/server/services/*` — **ยังรันใน process เดียวกับ Next.js** |

## สิ่งที่ยังไม่ทำ (โดยเจตนา)

- **ไม่แยก** Report Service / Notification Service เป็น microservice แยก deploy
- **ไม่แยก** database ต่อ tenant (ยัง shared MySQL + `organization_id` / `project_id`)

## เมื่อไหร่ควรแยก microservice

แยกเฉพาะเมื่อเกณฑ์ด้านล่างครบ **อย่างน้อย 2–3 ข้อ** และทีม ops พร้อม:

1. **โหลด PPTX / queue** กิน CPU/RAM จนกระทบ latency ของ MIS หลัก (>30s บ่อย, หลายงานพร้อมกัน)
2. **Notification** ต้องส่งหลายช่องทาง (email, LINE, push) และต้อง retry/DLQ แยกจาก web
3. **ทีม deploy** แยกได้ (CI/CD, monitoring, on-call ต่อ service)
4. **SLA** ต่างกัน (รายงานล้มได้ แต่ dashboard ต้อง up)
5. **Compliance** บังคับแยกขอบเขตข้อมูล (ข้อ 4 มักมาพร้อม multi-tenant จริงจัง)

ถ้ายังไม่ถึง → คง **BullMQ worker + module boundary** (Phase 2–3 ปัจจุบัน) คุ้มกว่า

## แผนแยก service (เมื่อจำเป็น)

```
[MIS Next.js] ──HTTP/internal──► [report-service]  ← ย้าย generate-pptx + BullMQ consumer
              ──HTTP/internal──► [notify-service]   ← ย้าย notification-service + channels
```

ขั้นตอนแนะนำ:

1. คง interface `reportService` / `notificationService` ไว้
2. สลับ implementation เป็น HTTP client ต่อ service ใหม่
3. แยก env (`REPORT_SERVICE_URL`) โดย default ยัง in-process

## Migration DB ที่มีข้อมูลอยู่แล้ว

```sql
-- สร้างองค์กร default แล้วผูกโปรเจกต์เดิม (รันครั้งเดียวหลัง db push)
INSERT INTO Organization (id, slug, name, created_at, updated_at)
VALUES ('org-default', 'default', 'องค์กรหลัก', NOW(), NOW());
UPDATE Project SET organization_id = 'org-default' WHERE organization_id IS NULL OR organization_id = '';
```

จากนั้นเพิ่ม `OrganizationMember` ให้ผู้ใช้ที่มีอยู่

หรือรัน `npx prisma db seed` ใน dev (ล้างข้อมูลเดิม)

## บัญชีทดสอบ (หลัง seed)

- **director / admin** — สลับได้ 2 โปรเจกต์ (รอบ 2570 เต็ม + รอบซ้อม 2571 ว่าง)
- **data01 / data02** — เฉพาะโปรเจกต์ที่มีคณะของตน
