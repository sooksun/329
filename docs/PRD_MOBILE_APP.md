# PRD — Mobile App สำหรับกรรมการ (329 MIS)

**เวอร์ชัน:** 1.0  
**วันที่:** 2026-05-24  
**โครงการอ้างอิง:** MIS กีฬา 329 ชาวจีนยูนาน (`edition-2570`)  
**Backend ที่มีอยู่:** Next.js 15 + Prisma + MySQL + NextAuth (`d:\laragon\www\329`)  
**เอกสารที่เกี่ยวข้อง:** `docs/PRD.md`, `docs/USERS.md`, `prisma/schema.prisma`

---

## 1. วัตถุประสงค์

สร้าง **แอปมือถือ (หรือ PWA)** สำหรับ **สมาชิกคณะกรรมการ** ให้:

1. **บันทึกข้อมูลงานของตนเอง** — อัปเดตความคืบหน้า, งานย่อย, อัปโหลดหลักฐาน, แสดงความคิดเห็น
2. **ดู Dashboard ของตนเอง** — KPI และรายการงานในขอบเขตคณะที่สังกัด
3. **ดูภาพรวมโครงการ (อ่านอย่างเดียว)** — ความคืบหน้ารวม, งานล่าช้า, หลักฐานรอตรวจ, วันเหลือก่อนงาน

**ข้อกำหนดสำคัญ:** ใช้ **ฐานข้อมูลเดียวกัน** กับระบบ MIS ปัจจุบัน — **ไม่สร้าง schema ใหม่** ยกเว้นตารางที่จำเป็นจริง (เช่น device token สำหรับ push ในอนาคต) ต้องอนุมัติก่อน

**เป้าหมายเอกสาร:** ส่งต่อ **Google AI Studio** เพื่อออกแบบ UI + generate โค้ดแอป โดยเรียก API ของ MIS ที่มีอยู่

---

## 2. ขอบเขต (Scope)

### 2.1 อยู่ในขอบเขต (In Scope)

| หมวด | รายละเอียด |
|------|------------|
| ผู้ใช้เป้าหมาย | `{abbr}_lead`, `{abbr}_staff` (28 บัญชี), `Task Owner` ที่ถูกมอบหมายงาน |
| Login | username + password (บัญชีเดียวกับ MIS) |
| Dashboard ส่วนตัว | KPI คณะของตน + งานที่รับผิดชอบ |
| ภาพรวมโครงการ | KPI ระดับโปรเจกต์ (read-only) |
| ภารกิจ | ดูรายการ / รายละเอียด / อัปเดต progress & status (ตามสิทธิ์) |
| งานย่อย | ดู / อัปเดต progress & status ของงานย่อยที่ `owner_id = ตนเอง` |
| หลักฐาน | ถ่ายรูป/เลือกไฟล์ → อัปโหลด พร้อม caption |
| ความคิดเห็น | โพสต์ comment ในงานของคณะตน |
| แจ้งเตือน | รายการ + mark as read |
| โปรไฟล์ | ดู / แก้ชื่อ / เปลี่ยนรหัสผ่าน |
| วันที่ | แสดงและรับค่าเป็น **พ.ศ.** (Buddhist Era) |

### 2.2 นอกขอบเขต (Out of Scope — ใช้ MIS Web)

- จัดการผู้ใช้ / คณะ / สมาชิก (admin)
- CRUD ความเสี่ยง / การประชุม (ยกเว้น Committee Lead อาจเพิ่มใน Phase 2)
- แก้ไขงบประมาณ / ธุรกรรมงบ
- ตรวจหลักฐาน อนุมัติ/ปฏิเสธ (ยกเว้น role `Evidence Reviewer` / Lead ใน Phase 2)
- สร้างรายงาน PowerPoint / Snapshot
- Audit log viewer
- Multi-project admin (เลือกโปรเจกต์ได้ แต่ไม่จัดการ org)

---

## 3. ผู้ใช้และบทบาท

### 3.1 Persona หลัก

| Persona | บัญชีตัวอย่าง | คณะ | สิ่งที่ทำบน Mobile |
|---------|--------------|-----|-------------------|
| **หัวหน้าฝ่าย** | `kl_lead` / `Pass329!` | กีฬาและการแข่งขัน | ดู dashboard คณะ, อัปเดตงานทั้งคณะ, อัปโหลดหลักฐาน, มอบหมายงานย่อย (ผ่าน web หรือ mobile Phase 2) |
| **เจ้าหน้าที่ฝ่าย** | `kl_staff` / `Pass329!` | เดียวกัน | อัปเดตงานย่อยของตน, อัปโหลดหลักฐาน, comment |
| **ผู้รับผิดชอบงานย่อย** | user ที่ `Subtask.owner_id` ชี้มา | ตาม task | อัปเดต progress/status งานย่อย + อัปโหลดหลักฐาน |

### 3.2 การผูกผู้ใช้กับคณะ

```
User ──< CommitteeMember >── Committee ──< Task / Subtask / Evidence
```

- หนึ่ง user อาจอยู่ **หลายคณะ** (ไม่ common ใน seed ปัจจุบัน — ส่วนใหญ่ 1 คณะต่อ 1 user)
- การกรองข้อมูล: `CommitteeMember.committee_id` WHERE `user_id = currentUser.id`
- ยกเว้น: `Project Director`, `Project Secretary`, `Super Admin` เห็นทุกคณะ (mobile อาจซ่อนฟีเจอร์ admin)

### 3.3 Permission ที่ใช้ (จาก `src/lib/rbac.ts`)

| Permission | Role ที่มี | ใช้บน Mobile |
|------------|-----------|--------------|
| `dashboard:view` | เกือบทุก role | ดู dashboard |
| `task:update-own` | Task Owner, Data Recorder | อัปเดตงาน/งานย่อยของตน |
| `task:manage` | Committee Lead, Secretary | อัปเดตงานในคณะ |
| `evidence:review` | Director, Reviewer | Phase 2 — ปุ่มอนุมัติ/ปฏิเสธ |

---

## 4. สถาปัตยกรรมและ Database

### 4.1 หลักการ

```
┌─────────────────┐     HTTPS/JSON      ┌──────────────────────────┐
│  Mobile App     │ ◄──────────────────►│  MIS Backend (Next.js)   │
│  (AI Studio)    │   NextAuth/JWT*     │  Existing API routes     │
└─────────────────┘                     └────────────┬─────────────┘
                                                     │
                                                     ▼
                                          ┌──────────────────────┐
                                          │  MySQL (yunnansports) │
                                          │  Prisma schema เดิม   │
                                          └──────────────────────┘
```

\* **Auth แนะนำสำหรับ Mobile:**  
- **Phase 1:** Cookie session ยากบน native → แนะนำเพิ่ม **`POST /api/mobile/login`** คืน token หรือใช้ **NextAuth Credentials + session token** ที่ mobile เก็บใน secure storage  
- **Phase 1 ทางเลือกเร็ว:** ทำเป็น **PWA** ช pointing ไป MIS URL เดิม (responsive) — ไม่ต้อง API ใหม่  
- เอกสารนี้สมมติ **Native/Hybrid app** เรียก REST API ที่มีอยู่ + endpoint auth เพิ่มเล็กน้อย

### 4.2 Database Connection

```env
DATABASE_URL="mysql://root@localhost:3306/yunnansports"
```

- **ห้าม** สร้าง DB ใหม่
- **ห้าม** เปลี่ยนชื่อตาราง/คอลัมน์ที่มีอยู่
- Soft delete: กรอง `deleted_at IS NULL` เสมอ

### 4.3 ตารางหลักที่ Mobile อ่าน/เขียน

| Model | อ่าน | เขียน | หมายเหตุ |
|-------|------|-------|----------|
| `User` | ✅ | ✅ (profile) | login, เปลี่ยนรหัสผ่าน |
| `Committee` | ✅ | ❌ | ชื่อคณะ, progress |
| `CommitteeMember` | ✅ | ❌ | ระบุคณะของ user |
| `Project` | ✅ | ❌ | edition, event_date, KPI รวม |
| `Task` | ✅ | ✅ | status, progress |
| `Subtask` | ✅ | ✅ | owner_id, progress |
| `Evidence` | ✅ | ✅ (create) | upload |
| `FileAsset` | ✅ | ✅ (via upload) | binary storage |
| `Comment` | ✅ | ✅ | task comments |
| `Notification` | ✅ | ✅ (read) | mark read |
| `Risk` | ✅ (คณะตน) | ❌ Phase 1 | read-only บน dashboard |
| `BudgetItem` | ✅ (aggregate) | ❌ | แสดงยอดรวมเท่านั้น |

---

## 5. หน้าจอและ User Flow

### 5.1 แผนที่หน้าจอ (Screen Map)

```
Login
  └── Home (Tab Bar)
        ├── ภาพรวม (Overview)     ← KPI โครงการ read-only
        ├── งานของฉัน (My Work)   ← Dashboard ส่วนตัว + รายการงาน
        ├── อัปโหลด (Quick Upload)← shortcut ถ่ายรูป → เลือกงาน
        ├── แจ้งเตือน (Alerts)
        └── โปรไฟล์ (Profile)
              └── ตั้งค่า / เปลี่ยนรหัสผ่าน

My Work → Task Detail → Subtask List → Subtask Edit
                      → Evidence List → Upload Evidence
                      → Comments

Task Detail → Update Status / Progress (ถ้ามีสิทธิ์)
```

### 5.2 Flow: อัปโหลดหลักฐาน (Core Flow)

```
1. ผู้ใช้เลือกภารกิจ (เฉพาะคณะตน / งานที่ owner)
2. เลือกงานย่อย (optional)
3. ถ่ายรูป หรือเลือกจาก gallery
4. กรอก caption (บังคับ)
5. POST /api/evidence/upload (multipart/form-data)
6. แสดง toast สำเร็จ → สถานะ PENDING รอตรวจ
7. แจ้งเตือนส่งไป reviewer (backend ทำอยู่แล้ว)
```

### 5.3 Flow: อัปเดตความคืบหน้างานย่อย

```
1. รายการ "งานของฉัน" กรอง Subtask WHERE owner_id = me
2. แตะงานย่อย → แก้ reported_progress (0–100), status
3. PATCH /api/subtasks/[id]
4. Backend rollup progress ขึ้น Task (มีอยู่แล้ว)
```

---

## 6. Dashboard — รายละเอียด KPI

### 6.1 ภาพรวมโครงการ (Overview Tab) — Read Only

ข้อมูลจาก `getSummaryMetrics(projectId)` — logic เดียวกับ web `/dashboard`

| KPI | แหล่งข้อมูล | การคำนวณ |
|-----|------------|----------|
| ความคืบหน้ารวม | `Task.verified_progress` + weight | `weightedProgress()` |
| งานทั้งหมด | count Task | |
| งานล่าช้า | `Task.status = DELAYED` | |
| หลักฐานรอตรวจ | `Evidence.status = PENDING` | |
| ความเสี่ยงวิกฤต/สูง | `Risk.level IN (Critical, High)` | |
| งบใช้จริง / วางแผน | `Project` + `BudgetItem` aggregate | |
| วันเหลือก่อนงาน | `Project.event_date - now()` | |
| รอบจัดงาน | `event_date` – `event_end_date` | แสดง พ.ศ. เช่น 29 มี.ค. 2570 – 5 เม.ย. 2570 |

### 6.2 Dashboard ของฉัน (My Work Tab)

**ขอบเขต:** เฉพาะ `Committee` ที่ user เป็นสมาชิก

| KPI | Query |
|-----|-------|
| งานในคณะทั้งหมด | Task WHERE committee_id IN (myCommittees) |
| งานล่าช้าในคณะ | + status DELAYED |
| งานย่อยของฉัน | Subtask WHERE owner_id = me |
| งานย่อยค้าง | Subtask owner=me AND status NOT IN (DONE, VERIFIED) |
| หลักฐานของฉนที่รอตรวจ | Evidence ที่ user อัปโหลด + PENDING |
| หลักฐานถูกปฏิเสธ | Evidence REJECTED ล่าสุด |
| ความคืบหน้าคณะ | weighted progress ของ Task ในคณะ |

**รายการด้านล่าง KPI:**
- Tab: `ทั้งหมด` | `รับผิดชอบ` | `ล่าช้า` | `รอหลักฐาน`
- เรียง: due_date ASC

---

## 7. API ที่มีอยู่แล้ว (ใช้ซ้ำได้)

Base URL ตัวอย่าง: `https://mis.example.com` หรือ `http://localhost:3000`

| Method | Endpoint | Mobile Use |
|--------|----------|------------|
| POST | `/api/auth/callback/credentials` | Login (NextAuth) — อาจต้อง wrap |
| GET | `/api/users/me` | โปรไฟล์ปัจจุบัน |
| PATCH | `/api/users/me` | แก้ชื่อ/รหัสผ่าน |
| GET | `/api/projects` | โปรเจกต์ที่เข้าถึงได้ |
| POST | `/api/projects/select` | เลือก active project (cookie) |
| GET | `/api/notifications` | รายการแจ้งเตือน |
| PATCH | `/api/notifications` | mark read |
| GET | `/api/tasks/export?format=json` | ดึงรายการงาน (มี committee filter ฝั่ง server) |
| GET | `/api/tasks/[id]` | รายละเอียดงาน *(ถ้ายังไม่มี GET ให้เพิ่ม)* |
| PATCH | `/api/tasks/[id]` | อัปเดต status/progress |
| PATCH | `/api/subtasks/[id]` | อัปเดตงานย่อย |
| POST | `/api/evidence/upload` | อัปโหลดหลักฐาน multipart |
| GET/POST | `/api/tasks/[id]/comments` | ความคิดเห็น |
| GET | `/api/files/[id]/download` | ดาวน์โหลด/แสดงรูป |

### 7.1 API ที่แนะนำให้ MIS Backend เพิ่ม (สำหรับ Mobile)

| Endpoint | เหตุผล |
|----------|--------|
| `POST /api/mobile/login` | คืน `{ token, user, committees, activeProjectId }` |
| `GET /api/mobile/dashboard/me` | KPI dashboard ส่วนตัว + committee scope ในคำขอเดียว |
| `GET /api/mobile/tasks/mine` | งาน + subtask ของ user paginated |
| `GET /api/mobile/evidence/mine` | หลักฐานที่ user อัปโหลด |

> Google AI Studio สามารถ mock response ชุดนี้ก่อน แล้วค่อยเชื่อม MIS จริง

### 7.2 ตัวอย่าง Response: Dashboard ของฉัน

```json
{
  "user": { "id": "...", "name": "...", "username": "kl_staff" },
  "project": { "id": "...", "name": "...", "edition": "2570" },
  "committees": [{ "id": "...", "name": "กีฬาและการแข่งขัน" }],
  "myKpi": {
    "subtasksTotal": 12,
    "subtasksPending": 4,
    "subtasksDelayed": 1,
    "evidencePending": 2,
    "evidenceRejected": 0,
    "committeeProgress": 67
  },
  "projectKpi": {
    "overall": 34,
    "totalTasks": 43,
    "delayedTasks": 3,
    "evidencePending": 5,
    "daysRemaining": 310,
    "budget": { "planned": 3660000, "actual": 0 }
  }
}
```

---

## 8. กฎธุรกิจ (ต้องยึดตาม MIS เดิม)

| # | กฎ | รายละเอียด |
|---|-----|------------|
| B1 | ขอบเขตคณะ | แก้ไข/อัปโหลดได้เฉพาะ Task ใน `CommitteeMember` ของ user (ยกเว้น Director/Secretary/Admin) |
| B2 | Progress | `reported_progress`, `verified_progress` อยู่ระหว่าง 0–100 |
| B3 | ปิดงาน DONE | ต้องมีหลักฐาน APPROVED + reviewer + verified_progress = 100% — mobile แสดง checklist ก่อนกดปิด |
| B4 | อัปโหลดหลักฐาน | สูงสุด 10 MB; MIME: pdf, jpeg, png, webp, text/plain |
| B5 | Caption | บังคับก่อน upload |
| B6 | งานล่าช้า | ระบบ auto `DELAYED` เมื่อเลย due — mobile แสดง badge |
| B7 | วันที่ | แสดง **พ.ศ.** (BBBB) ทุกที่; picker ใช้ Buddhist Era |
| B8 | Soft delete | ไม่แสดง record ที่ `deleted_at != null` |

---

## 9. UI/UX สำหรับ Mobile

### 9.1 หลักการออกแบบ

- **Mobile-first**, thumb-friendly (ปุ่ม min 44px)
- ภาษา **ไทย** ทั้งหมด
- สี brand: Navy `#123f76`, Gold `#b68a2e`, พื้นหลัง `#fbfaf5`
- Font: Sarabun (หรือ system Thai font)
- Offline: Phase 2 — queue upload เมื่อไม่มีเน็ต

### 9.2 Component สำคัญ

| Component | พฤติกรรม |
|-----------|----------|
| KPI Card | ตัวเลขใหญ่ + label ไทย |
| Task Card | code, title, committee, due (พ.ศ.), progress bar, status badge |
| Status Badge | แปลไทย: กำลังดำเนินการ, ล่าช้า, ตรวจแล้ว, เสร็จสิ้น |
| Camera Upload | เปิดกล้อง → preview → caption → ส่ง |
| Toast | success / error / confirm (แทน alert) |
| Pull to refresh | ทุก list screen |

### 9.3 สถานะ Task (แปลไทย)

| Code | ไทย |
|------|-----|
| NOT_STARTED | ยังไม่เริ่ม |
| IN_PROGRESS | กำลังดำเนินการ |
| SUBMITTED | ส่งตรวจ |
| REVISION_REQUIRED | ต้องแก้ไข |
| VERIFIED | ตรวจแล้ว |
| DONE | เสร็จสิ้น |
| DELAYED | ล่าช้า |

---

## 10. Authentication สำหรับ Mobile

### 10.1 บัญชีทดสอบ

| Username | Password | ใช้ทดสอบ |
|----------|----------|----------|
| `kl_staff` | `Pass329!` | เจ้าหน้าที่ฝ่ายกีฬา — flow หลัก |
| `kl_lead` | `Pass329!` | หัวหน้าฝ่าย — แก้งานทั้งคณะ |
| `director` | `password123` | เห็นทุกคณะ (overview) |

### 10.2 Flow แนะนำ

```
POST /api/mobile/login
Body: { "username": "kl_staff", "password": "Pass329!" }
Response: { "token": "...", "expiresAt": "...", "user": {...}, "projectId": "..." }

Header ทุก request ถัดไป:
Authorization: Bearer <token>
X-Project-Id: <projectId>   // หรือใช้ cookie ถ้า PWA
```

---

## 11. โครงสร้างข้อมูลอ้างอิง (Prisma)

### 11.1 Task (ย่อ)

```prisma
model Task {
  id                 String     @id
  project_id         String
  committee_id       String
  code               String     @unique
  title              String
  status             TaskStatus
  priority           Priority
  start_date         DateTime
  due_date           DateTime
  owner_id           String?
  reported_progress  Int        @default(0)
  verified_progress  Int        @default(0)
  subtasks           Subtask[]
  evidence           Evidence[]
  deleted_at         DateTime?
}
```

### 11.2 Subtask (ย่อ)

```prisma
model Subtask {
  id                 String     @id
  task_id            String
  owner_id           String?    // ← ใช้กรอง "งานของฉัน"
  title              String
  status             TaskStatus
  reported_progress  Int        @default(0)
  deleted_at         DateTime?
}
```

### 11.3 Evidence Upload (Form Fields)

```
POST /api/evidence/upload
Content-Type: multipart/form-data

task_id     (required)
subtask_id  (optional)
caption     (required)
file        (required, max 10MB)
```

---

## 12. แผนพัฒนา (สำหรับ Google AI Studio)

### Phase 1 — MVP (2–3 สัปดาห์)

- [ ] Login + เก็บ session
- [ ] Overview tab (KPI โครงการ)
- [ ] My Work tab (รายการงาน/งานย่อยของฉัน)
- [ ] Task detail (read)
- [ ] อัปเดต subtask progress
- [ ] อัปโหลดหลักฐาน (camera)
- [ ] แจ้งเตือน list + mark read
- [ ] โปrofile read

### Phase 2

- [ ] Comment ในงาน
- [ ] อัปเดต Task status (Lead)
- [ ] ตรวจหลักฐาน (Reviewer)
- [ ] Push notification
- [ ] Offline upload queue

### Phase 3

- [ ] บันทึกความเสี่ยง (Lead)
- [ ] Dashboard กราฟ
- [ ] Deep link จากแจ้งเตือน → task

---

## 13. Stack แนะนำ (ให้ AI Studio เลือก)

| ทางเลือก | ข้อดี | ข้อเสีย |
|----------|-------|--------|
| **Flutter** | UI สวย, camera ดี, build iOS/Android | ต้องเขียน API client เอง |
| **React Native + Expo** | ใกล้เคียง MIS (React), Expo camera | setup มากกว่า PWA |
| **PWA (Next.js responsive)** | ใช้ MIS เดิมได้เลย, DB/API ไม่แตะ | ประสบการณ์ native น้อยกว่า |

**แนะนำสำหรับ AI Studio:** Flutter หรือ React Native — เรียก REST API ตาม §7

---

## 14. ไฟล์อ้างอิงใน Repo

| ไฟล์ | เนื้อหา |
|------|---------|
| `prisma/schema.prisma` | Schema เต็ม |
| `docs/USERS.md` | บัญชี 30 คน |
| `src/lib/rbac.ts` | Permission matrix |
| `src/server/auth/committee-access.ts` | กฎขอบเขตคณะ |
| `src/server/project/queries/summary-metrics.ts` | KPI โครงการ |
| `src/app/api/evidence/upload/route.ts` | Upload rules |
| `src/app/api/subtasks/[id]/route.ts` | แก้งานย่อย |
| `src/lib/format-date.ts` | รูปแบบวันที่ พ.ศ. |

---

## 15. Prompt สำหรับ Google AI Studio

**ไฟล์ prompt เต็ม (copy-paste ได้):** [`PROMPT_MOBILE_APP.md`](./PROMPT_MOBILE_APP.md)

ประกอบด้วย:
- Prompt หลัก Phase 1 (Login, Dashboard, งานของฉัน, Upload, แจ้งเตือน, โปรไฟล์)
- Prompt ต่อเนื่อง Phase 2–4
- System instructions + checklist ก่อนส่ง AI

---

## 16. คำถามเปิด (ให้ทีม MIS ตัดสินก่อน build)

1. Mobile ใช้ **Native** หรือ **PWA**?
2. ต้องการ **JWT endpoint** ใหม่หรือใช้ NextAuth cookie ผ่าน WebView?
3. Committee Lead อนุมัติหลักฐานบน mobile ใน Phase 1 หรือ Phase 2?
4. รองรับ **หลายโปรเจกต์** บน mobile หรือ lock `edition-2570` อย่างเดียว?

---

*เอกสารนี้จัดทำเพื่อส่งต่อ Google AI Studio — อัปเดตเมื่อ MIS backend เพิ่ม mobile API*
