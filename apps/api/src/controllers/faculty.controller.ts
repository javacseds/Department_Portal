import { Request, Response, NextFunction } from 'express';
import { FacultyService } from '../services/faculty.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';

const createFacultySchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().optional(),
  departmentId: z.string(),
  employeeId: z.string(),
  designation: z.string(),
  phone: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.number().or(z.string()).optional(),
  dateOfJoining: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateFacultySchema = createFacultySchema.partial().omit({ email: true });

export class FacultyController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, departmentId } = req.query;
      
      const result = await FacultyService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        departmentId: departmentId as string || (req.user?.role !== 'SUPER_ADMIN' ? req.user?.departmentId : undefined),
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const faculty = await FacultyService.getById(req.params.id);
      res.status(200).json({ success: true, data: faculty });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createFacultySchema.parse(req.body);
      
      const collegeId = req.user?.collegeId;
      if (!collegeId) throw new AppError('College ID not found for user', 400);

      const faculty = await FacultyService.create({
        ...validatedData,
        collegeId,
      });

      res.status(201).json({ success: true, message: 'Faculty created successfully', data: faculty });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateFacultySchema.parse(req.body);
      const faculty = await FacultyService.update(req.params.id, validatedData);
      res.status(200).json({ success: true, message: 'Faculty updated successfully', data: faculty });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await FacultyService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Faculty deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

