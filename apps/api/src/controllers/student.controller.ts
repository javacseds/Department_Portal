import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';

const createStudentSchema = z.object({
  departmentId: z.string(),
  rollNumber: z.string().min(2),
  registerNumber: z.string().optional(),
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  batch: z.string(),
  section: z.string().optional(),
  semester: z.number().int().optional(),
  year: z.number().int().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateStudentSchema = createStudentSchema.partial();

export class StudentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, departmentId, batch, semester } = req.query;
      
      const result = await StudentService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        departmentId: departmentId as string || (req.user?.role !== 'SUPER_ADMIN' ? req.user?.departmentId : undefined),
        batch: batch as string,
        semester: semester ? Number(semester) : undefined,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.getById(req.params.id);
      res.status(200).json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createStudentSchema.parse(req.body);
      
      const payload = { ...validatedData };
      if (!payload.email) delete payload.email;
      
      if (payload.dateOfBirth) {
        payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString() as any;
      }

      const student = await StudentService.create(payload as any);
      res.status(201).json({ success: true, message: 'Student created successfully', data: student });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateStudentSchema.parse(req.body);
      
      const payload = { ...validatedData };
      if (payload.email === '') payload.email = undefined;
      
      if (payload.dateOfBirth) {
        payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString() as any;
      }

      const student = await StudentService.update(req.params.id, payload as any);
      res.status(200).json({ success: true, message: 'Student updated successfully', data: student });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await StudentService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
