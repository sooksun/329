/**
 * Notification domain — in-process module (ยังไม่แยก service)
 *
 * แจ้งเตือนส่วนตัว (user_id = ผู้ใช้) ใช้คอลัมน์ read_at
 * แจ้งเตือนรวม (user_id = null) ใช้ตาราง NotificationRead แยกต่อผู้ใช้ — คนหนึ่งอ่านไม่ทำให้คนอื่นเห็นว่าอ่านแล้ว
 */
import { prisma } from "@/lib/prisma";

function visibleTo(projectId: string, userId: string) {
  return { project_id: projectId, OR: [{ user_id: null }, { user_id: userId }] };
}

export const notificationService = {
  async listForProject(projectId: string, userId: string, limit = 20) {
    const rows = await prisma.notification.findMany({
      where: visibleTo(projectId, userId),
      include: { reads: { where: { user_id: userId }, select: { read_at: true } } },
      orderBy: { created_at: "desc" },
      take: limit
    });
    return rows.map(({ reads, ...row }) => ({
      ...row,
      read_at: row.user_id ? row.read_at : (reads[0]?.read_at ?? null)
    }));
  },

  async unreadCount(projectId: string, userId: string) {
    return prisma.notification.count({
      where: {
        project_id: projectId,
        OR: [
          { user_id: userId, read_at: null },
          { user_id: null, reads: { none: { user_id: userId } } }
        ]
      }
    });
  },

  async create(input: { projectId: string; title: string; body: string; userId?: string }) {
    return prisma.notification.create({
      data: {
        project_id: input.projectId,
        title: input.title,
        body: input.body,
        user_id: input.userId ?? null
      }
    });
  },

  async markRead(notificationId: string, projectId: string, userId: string) {
    // จำกัดเฉพาะแจ้งเตือนรวมหรือของผู้ใช้คนนั้นเอง — กันมาร์คอ่านของคนอื่น
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, ...visibleTo(projectId, userId) },
      select: { id: true, user_id: true }
    });
    if (!notification) return;

    if (notification.user_id) {
      await prisma.notification.update({ where: { id: notification.id }, data: { read_at: new Date() } });
      return;
    }
    await prisma.notificationRead.upsert({
      where: { notification_id_user_id: { notification_id: notification.id, user_id: userId } },
      create: { notification_id: notification.id, user_id: userId },
      update: {}
    });
  }
};

export type NotificationService = typeof notificationService;
