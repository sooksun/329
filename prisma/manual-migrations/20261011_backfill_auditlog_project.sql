-- 2026-10-11 เติม project_id ให้ audit log เก่า (ก่อนมีคอลัมน์) จาก entity ที่อ้างถึง
-- รันหลัง 20261011_codestatus_fixes.sql — รันซ้ำได้ (แก้เฉพาะแถวที่ project_id ยังว่าง)
-- แถวที่หา entity ไม่เจอ (ถูกลบถาวร) หรือ User จะคงเป็น NULL — เห็นได้เฉพาะ Super Admin

UPDATE `AuditLog` a JOIN `Task` t ON a.entity_id = t.id SET a.project_id = t.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Task';
UPDATE `AuditLog` a JOIN `Subtask` s ON a.entity_id = s.id JOIN `Task` t ON s.task_id = t.id SET a.project_id = t.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Subtask';
UPDATE `AuditLog` a JOIN `Comment` c ON a.entity_id = c.id JOIN `Task` t ON c.task_id = t.id SET a.project_id = t.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Comment';
UPDATE `AuditLog` a JOIN `TaskDependency` d ON a.entity_id = d.id JOIN `Task` t ON d.task_id = t.id SET a.project_id = t.project_id WHERE a.project_id IS NULL AND a.entity_type = 'TaskDependency';
UPDATE `AuditLog` a JOIN `Evidence` e ON a.entity_id = e.id SET a.project_id = e.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Evidence';
UPDATE `AuditLog` a JOIN `Risk` r ON a.entity_id = r.id SET a.project_id = r.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Risk';
UPDATE `AuditLog` a JOIN `Meeting` m ON a.entity_id = m.id SET a.project_id = m.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Meeting';
UPDATE `AuditLog` a JOIN `BudgetItem` b ON a.entity_id = b.id SET a.project_id = b.project_id WHERE a.project_id IS NULL AND a.entity_type = 'BudgetItem';
UPDATE `AuditLog` a JOIN `BudgetTransaction` bt ON a.entity_id = bt.id JOIN `BudgetItem` b ON bt.budget_item_id = b.id SET a.project_id = b.project_id WHERE a.project_id IS NULL AND a.entity_type = 'BudgetTransaction';
UPDATE `AuditLog` a JOIN `Committee` c ON a.entity_id = c.id SET a.project_id = c.project_id WHERE a.project_id IS NULL AND a.entity_type = 'Committee';
UPDATE `AuditLog` a JOIN `CommitteeMember` cm ON a.entity_id = cm.id JOIN `Committee` c ON cm.committee_id = c.id SET a.project_id = c.project_id WHERE a.project_id IS NULL AND a.entity_type = 'CommitteeMember';
UPDATE `AuditLog` a JOIN `DashboardSnapshot` s ON a.entity_id = s.id SET a.project_id = s.project_id WHERE a.project_id IS NULL AND a.entity_type = 'DashboardSnapshot';
UPDATE `AuditLog` a JOIN `PowerPointReport` p ON a.entity_id = p.id SET a.project_id = p.project_id WHERE a.project_id IS NULL AND a.entity_type = 'PowerPointReport';
UPDATE `AuditLog` a JOIN `Project` p ON a.entity_id = p.id SET a.project_id = p.id WHERE a.project_id IS NULL AND a.entity_type = 'Project';
