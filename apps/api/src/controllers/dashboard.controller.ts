import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../config/database';
import { UserRole } from '@prisma/client';

export class DashboardController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const whereClause = user.role !== UserRole.SUPER_ADMIN && user.departmentId
        ? { departmentId: user.departmentId }
        : {};

      const [
        departmentCount,
        facultyCount,
        studentCount,
        eventCount,
        documentCount,
        pendingApprovals,
        fileCount,
        recentActivity,
      ] = await Promise.all([
        prisma.department.count({ where: { isActive: true } }),
        prisma.faculty.count({ where: whereClause }),
        prisma.student.count({ where: whereClause }),
        prisma.event.count({ where: whereClause }),
        prisma.document.count({ where: { ...whereClause, isArchived: false } }),
        prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
        prisma.fileUpload.count({ where: whereClause }),
        prisma.activityLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { firstName: true, lastName: true, avatarUrl: true, role: true },
            },
          },
        }),
      ]);

      // Storage usage
      const storageResult = await prisma.fileUpload.aggregate({
        _sum: { fileSize: true },
        where: whereClause,
      });
      const storageUsedBytes = storageResult._sum.fileSize || 0;
      const storageUsedMB = Math.round(storageUsedBytes / (1024 * 1024) * 10) / 10;

      // Monthly document generation trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyDocs = await prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "created_at"), 'Mon YYYY') as month,
               COUNT(*)::int as count
        FROM documents
        WHERE created_at >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY DATE_TRUNC('month', "created_at")
      `;

      // Events by type
      const eventsByType = await prisma.event.groupBy({
        by: ['eventType'],
        _count: true,
        where: whereClause,
      });

      // Documents by type
      const docsByType = await prisma.document.groupBy({
        by: ['documentType'],
        _count: true,
        where: { ...whereClause, isArchived: false },
      });

      res.json({
        success: true,
        data: {
          stats: {
            departments: departmentCount,
            faculty: facultyCount,
            students: studentCount,
            events: eventCount,
            documents: documentCount,
            pendingApprovals,
            files: fileCount,
            storageUsedMB,
          },
          charts: {
            monthlyDocuments: monthlyDocs,
            eventsByType: eventsByType.map((e) => ({
              type: e.eventType,
              count: e._count,
            })),
            documentsByType: docsByType.map((d) => ({
              type: d.documentType,
              count: d._count,
            })),
          },
          recentActivity,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCalendarEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { month, year } = req.query;
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);

      const events = await prisma.event.findMany({
        where: {
          startDate: { gte: startDate, lte: endDate },
          ...(req.user!.departmentId ? { departmentId: req.user!.departmentId } : {}),
        },
        select: {
          id: true,
          title: true,
          eventType: true,
          startDate: true,
          endDate: true,
          venue: true,
          department: { select: { name: true, shortName: true } },
        },
        orderBy: { startDate: 'asc' },
      });

      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
