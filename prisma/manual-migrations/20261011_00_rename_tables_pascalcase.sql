-- 2026-10-11 เปลี่ยนชื่อตารางเป็น PascalCase ให้ตรงกับ Prisma model (ไม่มี @@map)
-- จำเป็นเฉพาะ server ที่ lower_case_table_names = 0 (Linux) และตารางถูกนำเข้าเป็นตัวพิมพ์เล็ก
-- (dump จาก Windows/Laragon) — ไม่งั้น Prisma หา `Task`, `Risk` ฯลฯ ไม่เจอ
-- ตรวจก่อนรัน:  SELECT @@lower_case_table_names;  ต้องได้ 0  และ SHOW TABLES; ต้องเป็นตัวพิมพ์เล็ก
-- RENAME TABLE คำสั่งเดียว = atomic (สำเร็จทั้งหมดหรือไม่เปลี่ยนเลย) · ไม่แตะข้อมูล · ไม่แตะตาราง `calendar`
-- ลำดับ: รันไฟล์นี้ก่อน 20261011_codestatus_fixes.sql และ 20261011_backfill_auditlog_project.sql

RENAME TABLE
  `organization` TO `Organization`,
  `organizationmember` TO `OrganizationMember`,
  `user` TO `User`,
  `role` TO `Role`,
  `permission` TO `Permission`,
  `userrole` TO `UserRole`,
  `rolepermission` TO `RolePermission`,
  `project` TO `Project`,
  `committee` TO `Committee`,
  `committeemember` TO `CommitteeMember`,
  `plan` TO `Plan`,
  `task` TO `Task`,
  `subtask` TO `Subtask`,
  `taskdependency` TO `TaskDependency`,
  `evidence` TO `Evidence`,
  `fileasset` TO `FileAsset`,
  `budgetitem` TO `BudgetItem`,
  `budgettransaction` TO `BudgetTransaction`,
  `risk` TO `Risk`,
  `meeting` TO `Meeting`,
  `meetingagenda` TO `MeetingAgenda`,
  `meetingactionitem` TO `MeetingActionItem`,
  `dashboardsnapshot` TO `DashboardSnapshot`,
  `powerpointreport` TO `PowerPointReport`,
  `reportgenerationjob` TO `ReportGenerationJob`,
  `notification` TO `Notification`,
  `comment` TO `Comment`,
  `auditlog` TO `AuditLog`;
