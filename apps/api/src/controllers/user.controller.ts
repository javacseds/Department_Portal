import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { z } from 'zod';
import { AppError } from '../middlewares/error';
import { USER_ROLES } from '@cddas/shared';

const createUserSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(Object.values(USER_ROLES) as any),
  employeeId: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  collegeId: z.string().optional(),
  departmentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
});

export class UserController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, role, departmentId } = req.query;
      
      const result = await UserService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        role: role as string,
        collegeId: req.user?.collegeId, // Restrict to own college
        departmentId: departmentId as string,
      });

      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getById(req.params.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      
      const data = {
        ...validatedData,
        collegeId: validatedData.collegeId || req.user?.collegeId,
      };

      if (!data.collegeId) {
        throw new AppError(400, 'College ID is required');
      }

      const user = await UserService.create(data as any);
      res.status(201).json({ success: true, message: 'User created successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const user = await UserService.update(req.params.id, validatedData);
      res.status(200).json({ success: true, message: 'User updated successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
