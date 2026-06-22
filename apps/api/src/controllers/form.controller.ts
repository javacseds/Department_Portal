import { Request, Response, NextFunction } from 'express';
import { FormService } from '../services/form.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';

const createFormSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  departmentId: z.string().optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
  schema: z.record(z.any()), // JSON schema representing the form structure
});

const updateFormSchema = createFormSchema.partial();

export class FormController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, departmentId, category } = req.query;
      
      const result = await FormService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        departmentId: departmentId as string || (req.user?.role !== 'SUPER_ADMIN' ? req.user?.departmentId : undefined),
        category: category as string,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const form = await FormService.getById(req.params.id);
      res.status(200).json({ success: true, data: form });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createFormSchema.parse(req.body);
      
      const userId = req.user?.id;
      if (!userId) throw new AppError(401, 'Unauthorized');

      const form = await FormService.create({
        ...validatedData,
        createdBy: userId,
      } as any);

      res.status(201).json({ success: true, message: 'Form created successfully', data: form });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateFormSchema.parse(req.body);
      const form = await FormService.update(req.params.id, validatedData as any);
      res.status(200).json({ success: true, message: 'Form updated successfully', data: form });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await FormService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Form deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
