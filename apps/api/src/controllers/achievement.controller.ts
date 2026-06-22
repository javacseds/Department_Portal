import { Request, Response, NextFunction } from 'express';
import { AchievementService } from '../services/achievement.service';
import { z } from 'zod';

const createAchievementSchema = z.object({
  type: z.enum(['PUBLICATION', 'PATENT', 'AWARD', 'PROJECT']),
  title: z.string().min(2),
  description: z.string().optional(),
  date: z.string(),
  facultyId: z.string().optional(),
  studentId: z.string().optional(),
  departmentId: z.string().optional(),
  details: z.record(z.any()).optional(),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  proofUrl: z.string().optional(),
});

const updateAchievementSchema = createAchievementSchema.partial();

export class AchievementController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, departmentId, type, status, facultyId, studentId } = req.query;
      
      const result = await AchievementService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        departmentId: departmentId as string || (req.user?.role !== 'SUPER_ADMIN' ? req.user?.departmentId : undefined),
        type: type as string,
        status: status as string,
        facultyId: facultyId as string,
        studentId: studentId as string,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const achievement = await AchievementService.getById(req.params.id);
      res.status(200).json({ success: true, data: achievement });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createAchievementSchema.parse(req.body);
      
      const payload = {
        ...validatedData,
        date: new Date(validatedData.date).toISOString() as any,
      };

      const achievement = await AchievementService.create(payload as any);
      res.status(201).json({ success: true, message: 'Achievement logged successfully', data: achievement });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateAchievementSchema.parse(req.body);
      
      const payload: any = { ...validatedData };
      if (validatedData.date) payload.date = new Date(validatedData.date).toISOString();

      const achievement = await AchievementService.update(req.params.id, payload);
      res.status(200).json({ success: true, message: 'Achievement updated successfully', data: achievement });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await AchievementService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Achievement deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
