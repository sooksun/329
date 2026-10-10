-- 2026-10-11 เติม project_id ให้ audit log เก่า (ก่อนมีคอลัมน์) จาก entity ที่อ้างถึง
-- รันหลัง 20261011_codestatus_fixes.sql — รันซ้ำได้ (แก้เฉพาะแถวที่ project_id ยังว่าง)
-- แถวที่หา entity ไม่เจอ (ถูกลบถาวร) หรือ User จะคงเป็น NULL — เห็นได้เฉพาะ Super Admin

UPDATE `auditlog` a JOIN `task` t ON a.entity_id = t.id SET a.project_id = t.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Task';
UPDATE `auditlog` a JOIN `subtask` s ON a.entity_id = s.id JOIN `task` t ON s.task_id = t.id SET a.project_id = t.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Subtask';
UPDATE `auditlog` a JOIN `comment` c ON a.entity_id = c.id JOIN `task` t ON c.task_id = t.id SET a.project_id = t.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Comment';
UPDATE `auditlog` a JOIN `taskdependency` d ON a.entity_id = d.id JOIN `task` t ON d.task_id = t.id SET a.project_id = t.project_id WHERE a.project_id IS NULL AND a.entity_type = 'TaskDependency';
UPDATE `auditlog` a JOIN `evidence` e ON a.entity_id = e.id SET a.project_id = e.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Evidence';
UPDATE `auditlog` a JOIN `risk` r ON a.entity_id = r.id SET a.project_id = r.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Risk';
UPDATE `auditlog` a JOIN `meeting` m ON a.entity_id = m.id SET a.project_id = m.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Meeting';
UPDATE `auditlog` a JOIN `budgetitem` b ON a.entity_id = b.id SET a.project_id = b.project_id WHERE a.project_id IS NULL AND a.entity_type = 'BudgetItem';
UPDATE `auditlog` a JOIN `budgettransaction` bt ON a.entity_id = bt.id JOIN `budgetitem` b ON bt.budget_item_id = b.id SET a.project_id = b.project_id WHERE a.project_id IS NULL AND a.entity_type = 'BudgetTransaction';
UPDATE `auditlog` a JOIN `committee` c ON a.entity_id = c.id SET a.project_id = c.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Committee';
UPDATE `auditlog` a JOIN `committeemember` cm ON a.entity_id = cm.id JOIN `committee` c ON cm.committee_id = c.id SET a.project_id = c.project_id WHERE a.project_id IS NULL AND a.entity_type = 'CommitteeMember';
UPDATE `auditlog` a JOIN `dashboardsnapshot` s ON a.entity_id = s.id SET a.project_id = s.project_id WHERE a.project_id IS NULL AND a.entity_type = 'DashboardSnapshot';
UPDATE `auditlog` a JOIN `powerpointreport` p ON a.entity_id = p.id SET a.project_id = p.project_id WHERE a.project_id IS NULL AND a.entity_type = 'PowerPointReport';
UPDATE `auditlog` a JOIN `project` p ON a.entity_id = p.id SET a.project_id = p.id WHERE a.project_id IS NULL AND a.entity_type = 'Project';
