import { prisma, Prisma, Approval } from '@cddas/database';
import { AppError } from '../middlewares/error';
import { NotificationService } from './notification.service';

export class ApprovalService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
    requesterId?: string;
    approverRole?: string;
    pendingForRole?: string; // Get approvals that this role needs to act on
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.ApprovalWhereInput = {
      ...(params.status && { status: params.status }),
      ...(params.departmentId && { departmentId: params.departmentId }),
      ...(params.requesterId && { requesterId: params.requesterId }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    // If we need to find approvals pending for a specific role
    if (params.pendingForRole) {
      where.status = { in: ['PENDING', 'IN_PROGRESS'] };
      where.stages = {
        some: {
          status: 'PENDING',
          approverRole: params.pendingForRole,
          // Ensure it's this stage's turn to act
          // This is a simplification. Ideally, we match stageOrder == currentStage
          // Prisma doesn't support field-to-field comparison in where clause easily, 
          // so we'll filter post-query or assume linear stage progression logic.
        }
      };
    }

    const [total, data] = await Promise.all([
      prisma.approval.count({ where }),
      prisma.approval.findMany({
        where,
        skip,
        take: limit,
        include: {
          requester: { select: { id: true, firstName: true, lastName: true, role: true } },
          department: { select: { id: true, name: true, shortName: true } },
          stages: {
            orderBy: { stageOrder: 'asc' },
            include: {
              approver: { select: { firstName: true, lastName: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Post filter for pendingForRole to strictly match currentStage
    let filteredData = data;
    if (params.pendingForRole) {
      filteredData = data.filter(app => {
        const activeStage = app.stages.find(s => s.stageOrder === app.currentStage);
        return activeStage && activeStage.approverRole === params.pendingForRole && activeStage.status === 'PENDING';
      });
    }

    return {
      data: filteredData,
      meta: { total: params.pendingForRole ? filteredData.length : total, page, limit, totalPages: Math.ceil((params.pendingForRole ? filteredData.length : total) / limit) },
    };
  }

  static async getById(id: string) {
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, shortName: true } },
        event: true,
        file: true,
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: {
            approver: { select: { firstName: true, lastName: true } }
          }
        }
      },
    });

    if (!approval) throw new AppError(404, 'Approval request not found');
    return approval;
  }

  static async create(data: {
    type: string;
    title: string;
    description?: string;
    requesterId: string;
    departmentId?: string;
    eventId?: string;
    fileId?: string;
    stages: Array<{ approverRole: string; stageOrder: number }>;
  }) {
    // Basic validation
    if (!data.stages || data.stages.length === 0) {
      throw new AppError(400, 'Approval must have at least one stage');
    }

    const approval = await prisma.approval.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        requesterId: data.requesterId,
        departmentId: data.departmentId,
        eventId: data.eventId,
        fileId: data.fileId,
        status: 'PENDING',
        currentStage: 1,
        stages: {
          create: data.stages.map(s => ({
            stageOrder: s.stageOrder,
            approverRole: s.approverRole,
            status: 'PENDING',
          }))
        }
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true } },
        stages: true
      }
    });

    // Notify the first approver
    const firstStage = approval.stages.find(s => s.stageOrder === 1);
    if (firstStage) {
      await NotificationService.createSystemNotification({
        title: `Action Required: ${approval.title}`,
        message: `${approval.requester.firstName} ${approval.requester.lastName} has requested approval for ${approval.type}.`,
        targetRoles: [firstStage.approverRole],
        type: 'APPROVAL',
        departmentId: approval.departmentId || undefined,
        link: `/approvals`
      });
    }

    return approval;
  }

  static async processAction(approvalId: string, actionData: {
    action: 'APPROVE' | 'REJECT';
    comments?: string;
    approverId: string;
    approverRole: string;
  }) {
    const approval = await this.getById(approvalId);

    if (approval.status === 'APPROVED' || approval.status === 'REJECTED') {
      throw new AppError(400, `Approval is already ${approval.status}`);
    }

    // Find the current active stage
    const activeStage = approval.stages.find(s => s.stageOrder === approval.currentStage);
    
    if (!activeStage) {
      throw new AppError(500, 'Invalid approval state: Active stage not found');
    }

    // Verify role (in a real system, also check if user has this role)
    if (activeStage.approverRole !== actionData.approverRole && actionData.approverRole !== 'SUPER_ADMIN') {
      throw new AppError(403, `You are not authorized to act on this stage. Expected role: ${activeStage.approverRole}`);
    }

    // Update the stage
    await prisma.approvalStage.update({
      where: { id: activeStage.id },
      data: {
        status: actionData.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        comments: actionData.comments,
        approverId: actionData.approverId,
        actionDate: new Date()
      }
    });

    // Determine next state for the main approval
    let newStatus = approval.status;
    let nextStageNum = approval.currentStage;

    if (actionData.action === 'REJECTED') {
      newStatus = 'REJECTED';
      
      // Notify requester
      await NotificationService.createSystemNotification({
        title: `Request Rejected`,
        message: `Your request "${approval.title}" was rejected by ${actionData.approverRole}.`,
        userId: approval.requesterId,
        type: 'SYSTEM',
        link: `/approvals`
      });

    } else if (actionData.action === 'APPROVE') {
      // Check if there are more stages
      const maxStage = Math.max(...approval.stages.map(s => s.stageOrder));
      if (approval.currentStage >= maxStage) {
        newStatus = 'APPROVED';
        
        // Notify requester
        await NotificationService.createSystemNotification({
          title: `Request Approved!`,
          message: `Your request "${approval.title}" has been fully approved.`,
          userId: approval.requesterId,
          type: 'SYSTEM',
          link: `/approvals`
        });

      } else {
        newStatus = 'IN_PROGRESS';
        nextStageNum = approval.currentStage + 1;
        
        // Notify next approver
        const nextStage = approval.stages.find(s => s.stageOrder === nextStageNum);
        if (nextStage) {
          await NotificationService.createSystemNotification({
            title: `Action Required: ${approval.title}`,
            message: `You have a pending approval request from ${approval.requester.firstName} ${approval.requester.lastName}.`,
            targetRoles: [nextStage.approverRole],
            type: 'APPROVAL',
            departmentId: approval.departmentId || undefined,
            link: `/approvals`
          });
        }
      }
    }

    // Update main approval record
    return prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: newStatus,
        currentStage: nextStageNum
      },
      include: { stages: { orderBy: { stageOrder: 'asc' } } }
    });
  }

  static async delete(id: string) {
    await this.getById(id);
    await prisma.approval.delete({ where: { id } });
    return true;
  }
}
