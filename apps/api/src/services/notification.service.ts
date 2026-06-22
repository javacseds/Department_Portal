import { prisma, Prisma } from '@cddas/database';
import { AppError } from '../middlewares/error';

export class NotificationService {
  /**
   * Get notifications for a specific user based on their ID, role, and department.
   */
  static async getUserNotifications(userId: string, role: string, departmentId?: string, params?: { limit?: number; unreadOnly?: boolean }) {
    const limit = Number(params?.limit) || 50;

    const where: Prisma.NotificationWhereInput = {
      OR: [
        // Direct notifications
        { userId: userId },
        // Role based broadcast
        { 
          targetRoles: { has: role },
          OR: [
            { departmentId: null }, // Global broadcast
            { departmentId: departmentId } // Department specific broadcast
          ]
        }
      ],
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
    // Note: If it's a broadcast notification (targetRoles), marking it as read
    // modifies the global notification object which isn't ideal for multi-user state.
    // In a full production system, we'd use a bridging table (UserNotificationStatus).
    // For this implementation, we will update it directly (assumes mostly direct notifications 
    // or accepts that marking a broadcast read marks it for all in the prototype).
    
    // Better prototype solution: We won't mark broadcast notifications as read globally,
    // only user-specific ones.
    const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notif) throw new AppError(404, 'Notification not found');

    if (notif.userId === userId) {
      return prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
    }
    
    return notif;
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId: userId, isRead: false },
      data: { isRead: true }
    });
  }

  /**
   * Internal service method to trigger notifications from other modules
   */
  static async createSystemNotification(data: {
    title: string;
    message: string;
    type?: string;
    userId?: string;
    targetRoles?: string[];
    departmentId?: string;
    link?: string;
  }) {
    return prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || 'SYSTEM',
        userId: data.userId,
        targetRoles: data.targetRoles || [],
        departmentId: data.departmentId,
        link: data.link
      }
    });
  }
}
