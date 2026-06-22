import { Request, Response, NextFunction } from 'express';
import { CircularService } from '../services/circular.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';
import { USER_ROLES } from '@cddas/shared';

const createCircularSchema = z.object({
  referenceNo: z.string().min(2),
  title: z.string().min(2),
  content: z.string().min(2),
  type: z.enum(['GENERAL', 'ACADEMIC', 'EXAM', 'HOLIDAY', 'URGENT']),
  targetAudience: z.array(z.string()),
  departmentId: z.string().optional(),
  eventId: z.string().optional(),
  issueDate: z.string().optional(),
  validUntil: z.string().optional(),
  isGlobal: z.boolean().optional(),
  fileId: z.string().optional(),
});

const updateCircularSchema = createCircularSchema.partial();

export class CircularController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, departmentId, type } = req.query;
      const userRole = req.user?.role;
      
      const result = await CircularService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        departmentId: departmentId as string || (userRole !== USER_ROLES.SUPER_ADMIN ? req.user?.departmentId : undefined),
        type: type as string,
        // If not admin, restrict circulars by their role
        role: [USER_ROLES.SUPER_ADMIN, USER_ROLES.HOD, USER_ROLES.DEPARTMENT_ADMIN].includes(userRole as any) 
          ? undefined 
          : userRole,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const circular = await CircularService.getById(req.params.id);
      res.status(200).json({ success: true, data: circular });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createCircularSchema.parse(req.body);
      
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const payload = {
        ...validatedData,
        issueDate: validatedData.issueDate ? new Date(validatedData.issueDate).toISOString() : new Date().toISOString(),
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil).toISOString() : undefined,
        createdBy: userId,
      };

      const circular = await CircularService.create(payload as any);
      res.status(201).json({ success: true, message: 'Circular published successfully', data: circular });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateCircularSchema.parse(req.body);
      
      const payload: any = { ...validatedData };
      if (validatedData.issueDate) payload.issueDate = new Date(validatedData.issueDate).toISOString();
      if (validatedData.validUntil) payload.validUntil = new Date(validatedData.validUntil).toISOString();

      const circular = await CircularService.update(req.params.id, payload);
      res.status(200).json({ success: true, message: 'Circular updated successfully', data: circular });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CircularService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Circular deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

