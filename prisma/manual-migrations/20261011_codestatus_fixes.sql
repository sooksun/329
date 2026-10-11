-- 2026-10-11 codestatus fixes — ใช้แทน `prisma db push` บน DB ที่มีตารางนอก Prisma (เช่น `calendar`)
-- db push จะ DROP ตาราง `calendar` ทิ้ง — ไฟล์นี้ตัดคำสั่งนั้นออกแล้ว
-- ชื่อตารางเป็น PascalCase ตาม Prisma model — server Linux ที่ตารางยังเป็นตัวพิมพ์เล็ก ให้รัน 20261011_00_rename_tables_pascalcase.sql ก่อน
-- ทุกคำสั่งเป็นการขยายคอลัมน์ / เพิ่มคอลัมน์ nullable / เพิ่มตารางและ index — ไม่ลบข้อมูล
-- สำรองก่อนรัน:  npm run db:backup  (หรือ scripts/backup-db.sh บน Ubuntu)
-- รัน:          npx prisma db execute --file prisma/manual-migrations/20261011_codestatus_fixes.sql --schema prisma/schema.prisma

-- DropIndex
DROP INDEX `Risk_code_key` ON `Risk`;

-- AlterTable
ALTER TABLE `AuditLog` ADD COLUMN `project_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `BudgetTransaction` MODIFY `note` TEXT NULL;

-- AlterTable
ALTER TABLE `Comment` MODIFY `body` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Evidence` MODIFY `rejection_reason` TEXT NULL;

-- AlterTable
ALTER TABLE `Meeting` MODIFY `notes` TEXT NOT NULL,
    MODIFY `decisions` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `MeetingActionItem` MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Notification` MODIFY `body` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Plan` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Project` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Risk` MODIFY `mitigation_plan` TEXT NOT NULL,
    MODIFY `contingency_plan` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Task` MODIFY `description` TEXT NULL,
    MODIFY `success_criteria` TEXT NOT NULL;

-- CreateTable
CREATE TABLE `NotificationRead` (
    `id` VARCHAR(191) NOT NULL,
    `notification_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NotificationRead_notification_id_user_id_key`(`notification_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AuditLog_project_id_created_at_idx` ON `AuditLog`(`project_id`, `created_at`);

-- CreateIndex
CREATE INDEX `Comment_task_id_created_at_idx` ON `Comment`(`task_id`, `created_at`);

-- CreateIndex
CREATE INDEX `Evidence_project_id_status_idx` ON `Evidence`(`project_id`, `status`);

-- CreateIndex
CREATE INDEX `Notification_project_id_user_id_created_at_idx` ON `Notification`(`project_id`, `user_id`, `created_at`);

-- CreateIndex
CREATE UNIQUE INDEX `Risk_project_id_code_key` ON `Risk`(`project_id`, `code`);

-- CreateIndex
CREATE INDEX `Task_project_id_deleted_at_status_idx` ON `Task`(`project_id`, `deleted_at`, `status`);

-- AddForeignKey
ALTER TABLE `NotificationRead` ADD CONSTRAINT `NotificationRead_notification_id_fkey` FOREIGN KEY (`notification_id`) REFERENCES `Notification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

