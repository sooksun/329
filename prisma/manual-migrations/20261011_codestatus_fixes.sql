-- 2026-10-11 codestatus fixes — ใช้แทน `prisma db push` บน DB ที่มีตารางนอก Prisma (เช่น `calendar`)
-- db push จะ DROP ตาราง `calendar` ทิ้ง — ไฟล์นี้ตัดคำสั่งนั้นออกแล้ว
-- ชื่อตารางเป็นตัวพิมพ์เล็กตาม prisma/yunnansports.sql (MariaDB/MySQL lower_case_table_names)
-- ทุกคำสั่งเป็นการขยายคอลัมน์ / เพิ่มคอลัมน์ nullable / เพิ่มตารางและ index — ไม่ลบข้อมูล
-- สำรองก่อนรัน:  npm run db:backup  (หรือ scripts/backup-db.sh บน Ubuntu)
-- รัน:          npx prisma db execute --file prisma/manual-migrations/20261011_codestatus_fixes.sql --schema prisma/schema.prisma

-- DropIndex
DROP INDEX `Risk_code_key` ON `risk`;

-- AlterTable
ALTER TABLE `auditlog` ADD COLUMN `project_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `budgettransaction` MODIFY `note` TEXT NULL;

-- AlterTable
ALTER TABLE `comment` MODIFY `body` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `evidence` MODIFY `rejection_reason` TEXT NULL;

-- AlterTable
ALTER TABLE `meeting` MODIFY `notes` TEXT NOT NULL,
    MODIFY `decisions` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `meetingactionitem` MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `notification` MODIFY `body` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `plan` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `project` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `risk` MODIFY `mitigation_plan` TEXT NOT NULL,
    MODIFY `contingency_plan` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `task` MODIFY `description` TEXT NULL,
    MODIFY `success_criteria` TEXT NOT NULL;


-- CreateTable
CREATE TABLE `notificationread` (
    `id` VARCHAR(191) NOT NULL,
    `notification_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NotificationRead_notification_id_user_id_key`(`notification_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AuditLog_project_id_created_at_idx` ON `auditlog`(`project_id`, `created_at`);

-- CreateIndex
CREATE INDEX `Comment_task_id_created_at_idx` ON `comment`(`task_id`, `created_at`);

-- CreateIndex
CREATE INDEX `Evidence_project_id_status_idx` ON `evidence`(`project_id`, `status`);

-- CreateIndex
CREATE INDEX `Notification_project_id_user_id_created_at_idx` ON `notification`(`project_id`, `user_id`, `created_at`);

-- CreateIndex
CREATE UNIQUE INDEX `Risk_project_id_code_key` ON `risk`(`project_id`, `code`);

-- CreateIndex
CREATE INDEX `Task_project_id_deleted_at_status_idx` ON `task`(`project_id`, `deleted_at`, `status`);

-- AddForeignKey
ALTER TABLE `notificationread` ADD CONSTRAINT `NotificationRead_notification_id_fkey` FOREIGN KEY (`notification_id`) REFERENCES `notification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

