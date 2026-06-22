import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '@cddas/database';
import { USER_ROLES } from '@cddas/shared';

export class DashboardController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const whereClause = user.role !== USER_ROLES.SUPER_ADMIN && user.departmentId
        ? { departmentId: user.departmentId }
        : {};

      const [
        departmentCount,
        facultyCount,
        studentCount,
        eventCount,
        achievementCount,
        pendingApprovals,
        fileCount,
        recentActivity,
      ] = await Promise.all([
        prisma.department.count(),
        prisma.faculty.count({ where: whereClause }),
        prisma.student.count({ where: whereClause }),
        prisma.event.count({ where: whereClause }),
        prisma.achievement.count({ where: whereClause }),
        prisma.approval.count({ where: { status: 'PENDING', ...whereClause } }),
        prisma.fileUpload.count({ where: whereClause }),
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { firstName: true, lastName: true, role: true },
            },
          },
        }),
      ]);

      // Storage usage
      const storageResult = await prisma.fileUpload.aggregate({
        _sum: { size: true },
        where: whereClause,
      });
      const storageUsedBytes = storageResult._sum.size || 0;
      const storageUsedMB = Math.round(storageUsedBytes / (1024 * 1024) * 10) / 10;

      // Monthly events trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyEvents = await prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "created_at"), 'Mon YYYY') as month,
               COUNT(*)::int as count
        FROM "events"
        WHERE created_at >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY DATE_TRUNC('month', "created_at")
      `;

      // Events by type
      const eventsByType = await prisma.event.groupBy({
        by: ['type'],
        _count: true,
        where: whereClause,
      });

      // Achievements by type
      const achievementsByType = await prisma.achievement.groupBy({
        by: ['type'],
        _count: true,
        where: whereClause,
      });

      res.json({
        success: true,
        data: {
          stats: {
            departments: departmentCount,
            faculty: facultyCount,
            students: studentCount,
            events: eventCount,
            achievements: achievementCount,
            pendingApprovals,
            files: fileCount,
            storageUsedMB,
          },
          charts: {
            monthlyEvents: monthlyEvents,
            eventsByType: eventsByType.map((e) => ({
              type: e.type,
              count: e._count,
            })),
            achievementsByType: achievementsByType.map((a) => ({
              type: a.type,
              count: a._count,
            })),
          },
          recentActivity,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
