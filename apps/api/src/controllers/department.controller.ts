import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/department.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';

const createDepartmentSchema = z.object({
  name: z.string().min(2),
  shortName: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  established: z.number().int().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  collegeId: z.string().optional(),
  hodId: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

export class DepartmentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, collegeId } = req.query;
      
      const result = await DepartmentService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        collegeId: collegeId as string || req.user?.collegeId,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await DepartmentService.getById(req.params.id);
      
      res.status(200).json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createDepartmentSchema.parse(req.body);
      
      // If no collegeId provided, use the logged-in user's collegeId
      const data = {
        ...validatedData,
        collegeId: validatedData.collegeId || req.user?.collegeId,
      };

      if (!data.collegeId) {
        throw new AppError(400, 'College ID is required');
      }

      const department = await DepartmentService.create(data as any);
      
      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateDepartmentSchema.parse(req.body);
      
      const department = await DepartmentService.update(req.params.id, validatedData);
      
      res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await DepartmentService.delete(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
