import { prisma, Prisma, NotificationType } from '@cddas/database';
import { AppError } from '../middlewares/error';

export class NotificationService {
  /**
   * Get notifications for a specific user based on their ID.
   */
  static async getUserNotifications(userId: string, role: string, departmentId?: string, params?: { limit?: number; unreadOnly?: boolean }) {
    const limit = Number(params?.limit) || 50;

    const where: Prisma.NotificationWhereInput = {
      userId: userId,
      ...(params?.unreadOnly && { isRead: false })
    };

    const data = await prisma.notification.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await prisma.notification.count({
      where: { ...where, isRead: false }
    });

    return { data, unreadCount };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notif) throw new AppError('Notification not found', 404);

    if (notif.userId === userId) {
      return prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() }
      });
    }
    
    return notif;
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
  }

  /**
   * Internal service method to trigger notifications from other modules
   */
  static async createSystemNotification(data: {
    title: string;
    message: string;
    type?: NotificationType;
    userId: string;
    link?: string;
  }) {
    return prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || NotificationType.SYSTEM,
        userId: data.userId,
        link: data.link
      }
    });
  }
}
