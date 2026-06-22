import { Request, Response, NextFunction } from 'express';
import { MomService } from '../services/mom.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';
import { USER_ROLES } from '@cddas/shared';

const createMeetingSchema = z.object({
  title: z.string().min(2),
  date: z.string(),
  time: z.string(),
  venue: z.string().optional(),
  agenda: z.string().min(2),
  minutes: z.string().optional(),
  departmentId: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  absentees: z.array(z.string()).optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  fileId: z.string().optional(),
});

const updateMeetingSchema = createMeetingSchema.partial();

export class MomController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, departmentId, status } = req.query;
      
      const result = await MomService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        departmentId: departmentId as string || (req.user?.role !== USER_ROLES.SUPER_ADMIN ? req.user?.departmentId : undefined),
        status: status as string,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await MomService.getById(req.params.id);
      res.status(200).json({ success: true, data: meeting });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createMeetingSchema.parse(req.body);
      
      const userId = req.user?.id;
      if (!userId) throw new AppError(401, 'Unauthorized');

      const payload = {
        ...validatedData,
        date: new Date(validatedData.date).toISOString() as any,
        organizerId: userId,
      };

      const meeting = await MomService.create(payload as any);
      res.status(201).json({ success: true, message: 'Meeting scheduled successfully', data: meeting });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateMeetingSchema.parse(req.body);
      
      const payload: any = { ...validatedData };
      if (validatedData.date) payload.date = new Date(validatedData.date).toISOString();

      const meeting = await MomService.update(req.params.id, payload);
      res.status(200).json({ success: true, message: 'Meeting updated successfully', data: meeting });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await MomService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Meeting deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
