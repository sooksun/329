# Prompt สำหรับ Google AI Studio — Mobile App 329 MIS

**ใช้คู่กับ:** [`PRD_MOBILE_APP.md`](./PRD_MOBILE_APP.md)  
**วันที่:** 2026-05-24

---

## วิธีใช้

1. เปิด [Google AI Studio](https://aistudio.google.com/)
2. สร้าง Project ใหม่ → เลือก **Build an app** (หรือ Chat + Generate code)
3. **Copy ทั้งบล็อก "Prompt หลัก"** ด้านล่าง → วางเป็นข้อความแรก
4. แนบไฟล์ `PRD_MOBILE_APP.md` เป็น context (ถ้ารองรับ file upload)
5. ใช้ **Prompt ต่อเนื่อง (Phase 2–4)** ทีละขั้นหลัง Phase ก่อนหน้าเสร็จ

---

## Prompt หลัก (Copy ทั้งหมด)

```
คุณคือ Senior Mobile Developer + UX Designer

## โปรเจกต์
สร้าง Mobile App สำหรับ "MIS กีฬา 329 ชาวจีนยูนาน" — ระบบบริหารงานจัดกีฬา (รอบจัดงาน 29 มี.ค. – 5 เม.ย. 2570)

## เป้าหมาย
แอปสำหรับ **สมาชิกคณะกรรมการ** (หัวหน้าฝ่าย + เจ้าหน้าที่) ให้:
1. บันทึกข้อมูลงานของตนเอง (progress, งานย่อย, หลักฐาน)
2. ดู Dashboard ส่วนตัว (เฉพาะคณะที่สังกัด)
3. ดูภาพรวมโครงการ (read-only)

## ข้อกำหนดสถาปัตยกรรม (สำคัญมาก)
- ใช้ **REST API จาก backend Next.js ที่มีอยู่แล้ว** — ห้ามสร้าง database ใหม่
- Database: MySQL `yunnansports` — schema ตาม Prisma ใน PRD
- API Base URL: `http://localhost:3000` (dev) — ออกแบบให้เปลี่ยน base URL ได้
- Phase 1: ใช้ **Mock API** ตาม JSON ใน PRD §7.2 ก่อน แล้วสลับเป็น API จริงทีหลัง

## Tech Stack ที่ต้องการ
- **Flutter** (Dart) — target Android + iOS
- State management: Riverpod หรือ Provider
- HTTP: dio
- เก็บ token: flutter_secure_storage
- วันที่: intl + Buddhist Era (แสดงปี พ.ศ. เช่น 29 มี.ค. 2570)
- ภาษา UI: **ไทยทั้งหมด**

## Design System
- Primary: Navy #123f76
- Accent: Gold #b68a2e
- Background: #fbfaf5
- Error: #b91528
- Font: Sarabun (Google Fonts) หรือ Noto Sans Thai
- Mobile-first, ปุ่ม min height 48px, thumb zone ด้านล่าง
- Bottom Navigation 5 แท็บ: ภาพรวม | งานของฉัน | อัปโหลด | แจ้งเตือน | โปรไฟล์

## ผู้ใช้ทดสอบ
| Username  | Password   | บทบาท        |
|-----------|------------|--------------|
| kl_staff  | Pass329!   | เจ้าหน้าที่ฝ่ายกีฬา |
| kl_lead   | Pass329!   | หัวหน้าฝ่ายกีฬา   |
| director  | password123| ประธานโครงการ (เห็นทุกคณะ) |

## Phase 1 — สิ่งที่ต้องสร้างในรอบนี้

### 1. Login Screen
- username + password
- แสดง error ภาษาไทย
- หลัง login เก็บ token + user + projectId ใน secure storage
- Mock: POST /api/mobile/login → คืน token + user + committees

### 2. Home — Tab "ภาพรวม" (Overview)
KPI cards (read-only):
- ความคืบหน้ารวม % 
- งานทั้งหมด / งานล่าช้า
- หลักฐานรอตรวจ
- วันเหลือก่อนงาน
- งบใช้จริง / วางแผน (แสดงเป็น ฿X.X ล้าน)
- ข้อความรอบจัดงาน: "29 มี.ค. – 5 เม.ย. 2570"

Mock response ตาม PRD §7.2 field `projectKpi`

### 3. Home — Tab "งานของฉัน" (My Work)
KPI ส่วนตัว:
- งานย่อยของฉัน / ค้าง / ล่าช้า
- หลักฐานรอตรวจ / ถูกปฏิเสธ
- ความคืบหน้าคณะ %

List งาน/งานย่อย:
- กรอง: ทั้งหมด | รับผิดชอบ | ล่าช้า
- การ์ดแสดง: code, title, committee, due date (พ.ศ.), progress bar, status badge ไทย
- แตะ → Task Detail

### 4. Task Detail Screen
- แสดงข้อมูลงาน: title, description, status, progress, due date
- รายการงานย่อย (Subtask) — แตะแก้ไขได้ถ้า owner_id = ฉัน
- ปุ่ม "อัปโหลดหลักฐาน"
- รายการหลักฐานที่อัปโหลดแล้ว (status: รอตรวจ/อนุมัติ/ไม่ผ่าน)

### 5. Subtask Edit Screen
- Slider หรือ input: reported_progress 0–100
- Dropdown status: ยังไม่เริ่ม, กำลังดำเนินการ, ส่งตรวจ, ...
- ปุ่มบันทึก → PATCH /api/subtasks/[id]
- Toast สำเร็จ/ผิดพลาด

### 6. Upload Evidence Screen (Tab กลาง "อัปโหลด")
Flow:
1. เลือกภารกิจ (dropdown — เฉพาะคณะตน)
2. เลือกงานย่อย (optional)
3. ถ่ายรูป / เลือกจาก gallery
4. กรอก caption (บังคับ)
5. ส่ง → POST /api/evidence/upload (multipart)
- จำกัด 10 MB, รองรับ jpg/png/pdf
- Preview รูปก่อนส่ง

### 7. Notifications Tab
- รายการแจ้งเตือน เรียงใหม่สุดก่อน
- แตะ mark as read
- แสดงเวลาเป็น พ.ศ.

### 8. Profile Tab
- แสดงชื่อ, username, คณะที่สังกัด, role
- ปุ่มเปลี่ยนรหัสผ่าน (form)
- ปุ่มออกจากระบบ

## กฎธุรกิจ (ต้องทำตาม)
- แก้ไข/อัปโหลดได้เฉพาะงานในคณะที่ user เป็นสมาชิก
- Progress 0–100 เท่านั้น
- Caption หลักฐานบังคับ
- วันที่ทุกที่แสดงเป็น **พ.ศ.** (ปี 4 หลัก เช่น 2570)
- Status แปลไทย: NOT_STARTED=ยังไม่เริ่ม, IN_PROGRESS=กำลังดำเนินการ, DELAYED=ล่าช้า, DONE=เสร็จสิ้น, VERIFIED=ตรวจแล้ว

## API Endpoints (Phase 1 ใช้ Mock ก่อน)

มีจริงแล้ว (เชื่อมทีหลัง):
- PATCH /api/subtasks/[id]
- POST /api/evidence/upload
- GET/PATCH /api/notifications
- PATCH /api/users/me
- PATCH /api/tasks/[id]

แนะนำให้ mock (สร้าง interface พร้อมสลับ):
- POST /api/mobile/login
- GET /api/mobile/dashboard/me
- GET /api/mobile/tasks/mine

Mock dashboard response:
{
  "user": { "id": "u1", "name": "เจ้าหน้าที่กีฬา", "username": "kl_staff" },
  "project": { "id": "p1", "name": "กีฬา 329 ชาวจีนยูนาน", "edition": "2570" },
  "committees": [{ "id": "c1", "name": "กีฬาและการแข่งขัน" }],
  "myKpi": {
    "subtasksTotal": 12, "subtasksPending": 4, "subtasksDelayed": 1,
    "evidencePending": 2, "evidenceRejected": 0, "committeeProgress": 67
  },
  "projectKpi": {
    "overall": 34, "totalTasks": 43, "delayedTasks": 3,
    "evidencePending": 5, "daysRemaining": 310,
    "budget": { "planned": 3660000, "actual": 0 }
  }
}

## โครงสร้างโฟลเดอร์ที่ต้องการ
lib/
  main.dart
  app.dart
  core/          # theme, constants, router
  models/        # User, Task, Subtask, Evidence, Notification
  services/      # api_client, auth_service, mock_service
  providers/     # state
  screens/       # login, home, task_detail, upload, profile
  widgets/       # kpi_card, task_card, status_badge, progress_bar

## Deliverables รอบนี้
1. โค้ด Flutter ครบ Phase 1 ทุกหน้าจอ
2. Mock API service พร้อม interface สลับเป็น real API
3. README.md — วิธี run, เปลี่ยน API base URL, บัญชีทดสอบ
4. ไม่ต้องสร้าง backend ใหม่

## สิ่งที่ห้ามทำ
- ห้ามสร้าง database / schema ใหม่
- ห้ามทำฟีเจอร์ admin (จัดการ user, คณะ, งบ, รายงาน PPT)
- ห้าม hardcode ข้อมูล demo ใน UI — ใช้ mock service layer
- ห้ามใช้ภาษาอังกฤษใน UI (ยกเว้น code/status ภายใน)

เริ่มสร้างโปรเจกต Flutter ตาม Phase 1 ทั้งหมด แสดงโครงสร้างไฟล์ก่อน แล้ว generate โค้ดทีละ module
```

---

## Prompt ต่อเนื่อง — Phase 2 (หลัง Phase 1 เสร็จ)

```
ต่อจาก Mobile App 329 MIS (Phase 1)

เพิ่มฟีเจอร์ Phase 2:
1. Comment ใน Task Detail — GET/POST /api/tasks/[id]/comments, แสดง author + เวลา (พ.ศ.)
2. Committee Lead อัปเดต Task status ได้ (PATCH /api/tasks/[id]) — แสดงเฉพาะ role lead
3. Evidence Reviewer: ปุ่มอนุมัติ/ปฏิเสธ (POST /api/evidence/review) + เหตุผลปฏิเสธ
4. Pull-to-refresh ทุก list screen
5. Deep link จากแจ้งเตือน → เปิด Task Detail

ใช้ mock service เดิม + เพิ่ม interface สำหรับ API จริง
UI ภาษาไทย, toast แจ้งผล save/delete
```

---

## Prompt ต่อเนื่อง — Phase 3 (เชื่อม API จริง)

```
ต่อจาก Mobile App 329 MIS (Phase 2)

สลับจาก Mock API เป็น REST API จริงของ MIS backend:

Base URL: http://localhost:3000 (config ใน .env)

Auth:
- Implement POST /api/mobile/login (ถ้ายังไม่มี ให้สร้าง spec ใน comment สำหรับ backend team)
- หรือใช้ NextAuth credentials flow ผ่าน dio + cookie jar

เชื่อม endpoints จริง:
- PATCH /api/subtasks/[id]  body: { status, reported_progress }
- POST /api/evidence/upload  multipart: task_id, subtask_id?, caption, file
- GET/PATCH /api/notifications
- PATCH /api/users/me
- GET /api/tasks/export?format=json (กรองงานตาม committee ฝั่ง client)

Error handling:
- 401 → logout + กลับ login
- 403 → toast "ไม่มีสิทธิ์"
- 400 → แสดง message จาก server

ทดสอบกับ kl_staff / Pass329! และ kl_lead / Pass329!
```

---

## Prompt ต่อเนื่อง — Phase 4 (Polish)

```
ต่อจาก Mobile App 329 MIS (Phase 3)

ปรับปรุง UX:
1. Splash screen + logo 329
2. Empty state ภาษาไทย (ไม่มีงาน, ไม่มีแจ้งเตือน)
3. Loading skeleton แทน spinner
4. Offline banner "ไม่มีการเชื่อมต่อ"
5. เก็บ draft caption ก่อน upload สำเร็จ
6. App icon + ชื่อแอป "329 MIS"

Build:
- android/app/build.gradle config
- คำสั่ง flutter build apk --release
```

---

## System Instructions (ถ้า AI Studio แยก System / User)

**System:**
```
You are an expert Flutter developer building a Thai-language mobile app for event management.
Always use Buddhist Era (พ.ศ.) for dates. Never create a new database — consume existing REST APIs only.
Follow the PRD in PRD_MOBILE_APP.md strictly. UI text must be Thai. Code comments can be English.
Output complete, runnable Dart code with proper folder structure.
```

**User:** ใช้ "Prompt หลัก" ด้านบน

---

## Checklist ก่อนส่งให้ AI Studio

- [ ] แนบ `PRD_MOBILE_APP.md` เป็น context
- [ ] ระบุ stack: **Flutter**
- [ ] ระบุ Phase เริ่มต้น: **Phase 1 เท่านั้น** (อย่าให้ AI ทำทุก phase พร้อมกัน)
- [ ] ย้ำ: **Mock API ก่อน** — อย่า block ที่ backend ยังไม่มี mobile endpoint
- [ ] ทดสอบด้วย `kl_staff` / `Pass329!`

---

*คู่กับ [`PRD_MOBILE_APP.md`](./PRD_MOBILE_APP.md)*
