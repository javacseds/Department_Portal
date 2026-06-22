import { prisma, Prisma } from '@cddas/database';

export class AuditLogService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    entity?: string;
    userId?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(params.action && { action: params.action }),
      ...(params.entity && { entity: params.entity }),
      ...(params.userId && { userId: params.userId }),
      ...(params.search && {
        OR: [
          { ipAddress: { contains: params.search, mode: 'insensitive' } },
          { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
          { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Internal utility to log actions automatically from other services/controllers
   */
  static async logAction(data: {
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          details: data.details ? JSON.parse(JSON.stringify(data.details)) : undefined, // Ensure it's valid JSON
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });
    } catch (error) {
      // We don't want audit logging failures to break the main application flow
      console.error('Failed to write audit log:', error);
      return null;
    }
  }
}
