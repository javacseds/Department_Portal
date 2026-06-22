import { Request, Response, NextFunction } from 'express';
import { ApprovalService } from '../services/approval.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';

const createApprovalSchema = z.object({
  type: z.enum(['LEAVE', 'EVENT_PROPOSAL', 'BUDGET', 'DOCUMENT']),
  title: z.string().min(2),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  eventId: z.string().optional(),
  fileId: z.string().optional(),
  stages: z.array(z.object({
    approverRole: z.string(),
    stageOrder: z.number().int().min(1)
  })).min(1)
});

const actionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comments: z.string().optional()
});

export class ApprovalController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, departmentId, status, viewMode } = req.query;
      const user = req.user;

      if (!user) throw new AppError(401, 'Unauthorized');

      // viewMode can be 'my_requests' (what I asked for) or 'pending_action' (what I need to approve)
      const result = await ApprovalService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        departmentId: departmentId as string,
        status: status as string,
        requesterId: viewMode === 'my_requests' ? user.id : undefined,
        pendingForRole: viewMode === 'pending_action' ? user.role : undefined,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const approval = await ApprovalService.getById(req.params.id);
      res.status(200).json({ success: true, data: approval });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createApprovalSchema.parse(req.body);
      
      const userId = req.user?.id;
      if (!userId) throw new AppError(401, 'Unauthorized');

      const approval = await ApprovalService.create({
        ...validatedData,
        requesterId: userId,
      });

      res.status(201).json({ success: true, message: 'Approval workflow initiated', data: approval });
    } catch (error) {
      next(error);
    }
  }

  static async processAction(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = actionSchema.parse(req.body);
      
      const user = req.user;
      if (!user) throw new AppError(401, 'Unauthorized');

      const approval = await ApprovalService.processAction(req.params.id, {
        action: validatedData.action,
        comments: validatedData.comments,
        approverId: user.id,
        approverRole: user.role,
      });

      res.status(200).json({ success: true, message: `Request successfully ${validatedData.action.toLowerCase()}d`, data: approval });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ApprovalService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Approval request deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
