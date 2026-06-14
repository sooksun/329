/**
 * Notification domain — in-process module (ยังไม่แยก service)
 */
import { prisma } from "@/lib/prisma";

export const notificationService = {
  async listForProject(projectId: string, userId?: string, limit = 20) {
    return prisma.notification.findMany({
      where: {
        project_id: projectId,
        ...(userId ? { OR: [{ user_id: null }, { user_id: userId }] } : {})
      },
      orderBy: { created_at: "desc" },
      take: limit
    });
  },

  async unreadCount(projectId: string, userId?: string) {
    return prisma.notification.count({
      where: {
        project_id: projectId,
        read_at: null,
        ...(userId ? { OR: [{ user_id: null }, { user_id: userId }] } : {})
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

  async markRead(notificationId: string, projectId: string, userId?: string) {
    return prisma.notification.updateMany({
      // จำกัดเฉพาะแจ้งเตือนรวม (user_id = null) หรือของผู้ใช้คนนั้นเอง — กันมาร์คอ่านของคนอื่น
      where: {
        id: notificationId,
        project_id: projectId,
        ...(userId ? { OR: [{ user_id: null }, { user_id: userId }] } : {})
      },
      data: { read_at: new Date() }
    });
  }
};

export type NotificationService = typeof notificationService;
